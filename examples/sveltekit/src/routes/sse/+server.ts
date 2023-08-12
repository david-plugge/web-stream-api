import type { RequestHandler } from './$types';
import { sse } from 'web-stream-api/sse';

export const GET: RequestHandler = async ({ request }) => {
    const headerLastId = request.headers.get('last-event-id');
    let id = headerLastId ? parseInt(headerLastId) + 1 : 0;

    return sse({
        retryInterval: 0,
        handler({ emit, close }) {
            const timer = setInterval(() => {
                emit({
                    id,
                    event: 'message',
                    data: 'Hello world ' + id,
                });
                if (++id % 5 === 0) {
                    close();
                }
            }, 1000);

            return () => {
                clearInterval(timer);
            };
        },
    });
};
