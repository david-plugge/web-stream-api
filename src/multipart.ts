import { streamMultipart } from '@web3-storage/multipart-parser';

type MultipartPart = {
    name: string;
    data: AsyncIterable<Uint8Array>;
    filename?: string;
    contentType?: string;
};

export type FieldPart = {
    name: string;
    data: Uint8Array;
};

export type FilePart = {
    name: string;
    data: AsyncIterable<Uint8Array>;
    filename: string;
    contentType: string;
};

export async function parseMultipartFormData({
    request,
    onField,
    onFile,
}: {
    request: Request;
    onField: (field: FieldPart) => void;
    onFile: (file: FilePart) => void;
}): Promise<void> {
    let contentType = request.headers.get('Content-Type') || '';
    let [type, boundary] = contentType.split(/\s*;\s*boundary=/);

    if (!request.body || !boundary || type !== 'multipart/form-data') {
        throw new TypeError('Could not parse content as FormData.');
    }

    const parts: AsyncIterable<MultipartPart> = streamMultipart(
        request.body,
        boundary,
    );

    for await (let part of parts) {
        if (typeof part.filename === 'string') {
            // only pass basename as the multipart/form-data spec recommends
            // https://datatracker.ietf.org/doc/html/rfc7578#section-4.2
            part.filename = part.filename.split(/[/\\]/).pop()!;

            await onFile({
                name: part.name,
                data: part.data,
                filename: part.filename,
                contentType: part.contentType!,
            });
        } else {
            const chunks: Uint8Array[] = [];
            for await (const chunk of part.data) {
                chunks.push(chunk);
            }
            await onField({
                name: part.name,
                data: mergeArrays(chunks),
            });
        }
    }
}

export function mergeArrays(arrays: Uint8Array[]) {
    const out = new Uint8Array(
        arrays.reduce((total, arr) => total + arr.length, 0),
    );
    let offset = 0;
    for (const arr of arrays) {
        out.set(arr, offset);
        offset += arr.length;
    }
    return out;
}
