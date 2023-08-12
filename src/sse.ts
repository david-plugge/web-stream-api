type EventData =
    | string
    | number
    | boolean
    | { [x: string]: EventData }
    | Array<EventData>;

interface SseEvent {
    id?: string | number;
    event?: string;
    data?: EventData;
}

interface SSE {
    close(): void;
    write(data: string): void;
    emit(packet: SseEvent): void;
    signal: AbortSignal;
}

type MaybePromise<T> = Promise<T> | T;

export type Handler = (sse: SSE) => MaybePromise<(() => void) | void>;

export function sse({
    handler,
    retryInterval = 0,
    ...init
}: ResponseInit & { handler: Handler; retryInterval?: number }) {
    return new Response(sseReadable({ handler, retryInterval }), {
        ...init,
        headers: {
            ...init?.headers,
            'Content-Type': 'text/event-stream;charset=utf-8',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}

export function sseReadable({
    retryInterval,
    handler,
}: {
    handler: Handler;
    retryInterval?: number;
}) {
    let onClosePromise: Promise<(() => void) | void>;
    const ac = new AbortController();
    let open = false;

    return new ReadableStream({
        start(controller) {
            open = true;
            if (typeof retryInterval === 'number' && retryInterval >= 0) {
                controller.enqueue(`retry: ${retryInterval}\n\n`);
            }

            onClosePromise = Promise.resolve(
                handler({
                    signal: ac.signal,
                    close: () => {
                        if (!open) return;
                        open = false;
                        onClosePromise.then((c) => c?.());
                        controller.close();
                    },
                    write: (data) => {
                        if (!open) return;
                        controller.enqueue(data);
                    },
                    emit(packet: any) {
                        if (!open) return;
                        controller.enqueue(serializePacket(packet));
                    },
                }),
            );
        },
        cancel(reason) {
            if (!open) return;
            open = false;
            onClosePromise.then((c) => c?.());
            ac.abort(reason);
        },
    });
}

export function serializePacket({
    id,
    event = 'message',
    data,
}: SseEvent): string {
    let msg = '';

    if (event !== 'message') {
        msg += `event: ${event}\n`;
    }

    if (typeof id !== 'undefined') {
        msg += `id: ${id}\n`;
    }

    if (data) {
        const body =
            typeof data === 'object' ? JSON.stringify(data) : String(data);
        msg += body
            .split(/[\r\n]+/)
            .map((str) => `data: ${str}`)
            .join('\n');
    }

    return msg + '\n\n';
}
