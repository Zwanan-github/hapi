import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PiTransport } from './piTransport'

let fixtureDirectory: string

describe.skipIf(process.platform !== 'win32')('PiTransport on Windows', () => {
    beforeAll(async () => {
        fixtureDirectory = await mkdtemp(join(process.cwd(), '.tmp-pi-transport-test-'))
        await writeFile(join(fixtureDirectory, 'pi-test.cmd'), '@echo off\r\nexit /b 0\r\n')
    })

    afterAll(async () => {
        await rm(fixtureDirectory, { recursive: true, force: true })
    })

    it('launches an npm-style .cmd shim found on PATH', async () => {
        const transport = new PiTransport({
            command: 'pi-test',
            args: [],
            cwd: fixtureDirectory,
            env: {
                ...process.env,
                PATH: fixtureDirectory,
                PATHEXT: '.CMD',
            },
        })

        const result = new Promise<{ code: number | null; signal: string | null }>((resolve, reject) => {
            transport.onClose((code, signal) => resolve({ code, signal }))
            transport.onError(reject)
        })

        transport.start()

        await expect(result).resolves.toEqual({ code: 0, signal: null })
    })
})
