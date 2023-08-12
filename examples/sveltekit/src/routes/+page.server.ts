import type { Actions } from './$types';
import { mkdtemp, rm } from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import os from 'os';
import { parseMultipartFormData } from 'web-stream-api/multipart';

const MAX_FILE_SIZE = 1_000_000;

export const actions = {
    async default({ request }) {
        const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'sk-upload-'));

        const fields: Record<string, string> = {};
        const files: Record<string, string> = {};
        const decoder = new TextDecoder();

        await parseMultipartFormData({
            request,
            onField({ name, data }) {
                const value = decoder.decode(data);
                if (value) {
                    fields[name] = value;
                }
            },
            async onFile({ filename, data }) {
                if (filename) {
                    const tmpFile = path.join(tmpDir, filename);

                    const fileStream = createWriteStream(tmpFile);
                    fileStream.on('error', () => {
                        rm(tmpFile);
                    });

                    let size = 0;
                    let limitReached = false;
                    for await (const chunk of data) {
                        if (limitReached) continue;

                        size += chunk.byteLength;

                        if (size > MAX_FILE_SIZE) {
                            limitReached = true;
                            fileStream.destroy(new Error('Filesize reached'));
                            continue;
                        }

                        fileStream.write(chunk);
                    }

                    if (!limitReached) {
                        fileStream.end();
                        return tmpFile;
                    }
                    return '';
                }
            },
        });

        // do something with the files

        // delete the temporary files
        await rm(tmpDir, {
            recursive: true,
        });

        console.log({
            fields,
            files,
        });
    },
} satisfies Actions;
