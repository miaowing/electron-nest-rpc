import { ipcMain } from 'electron';
import { INestApplicationContext } from "@nestjs/common";
import { NEST_RPC_INVOKE_EVENT } from "./constants";

const cache = {};

export class NestRPC {
    static register(ctx: INestApplicationContext) {
        ipcMain.on(NEST_RPC_INVOKE_EVENT, async (e, cls, method, evt, ...params) => {
            const instance = cache[cls] || ctx.get(cls);
            if (!cache[cls]) {
                cache[cls] = instance;
            }

            try {
                params = NestRPC.handleParams(params, e, evt.callbacks);
                const data = await instance[method].apply(instance, params);
                e.sender.send(evt.event, null, data);
            } catch (err) {
                e.sender.send(evt.event, err.message || 'Unknown Exception', null);
            }
        })
    }

    private static handleParams(params: any[], e, callbacks) {
        const parameters = params.map((param, index) => {
            if (param.type === 'function') {
                const evt = callbacks.filter(cb => cb.index === index)[0];
                if (evt) {
                    return (...data) => e.sender.send(evt.event, ...data);
                } else {
                    return (...data) => void 0;
                }
            } else if (param.type === 'object' || param.type === 'boolean') {
                return JSON.parse(param.value);
            } else {
                return param.value;
            }
        });

        return parameters;
    }
}
