import { ipcRenderer } from 'electron';
import { Type } from "@nestjs/common";
import * as uuid from 'uuid/v1';
import { NEST_RPC_CALLBACK_EVENT, NEST_RPC_INVOKE_EVENT, NEST_RPC_INVOKE_RESPONSE_EVENT } from "./constants";


export const nestRPC = <T = any>(cls: Type<T>): T => {
    for (const key in cls.prototype) {
        const method = key;

        Object.defineProperty(cls.prototype, method, {
            value: async (...params) => {
                const result = handleParams(cls, method, params);
                const event = `${ NEST_RPC_INVOKE_RESPONSE_EVENT }__${ cls.name }__${ method }__${ uuid() }`;

                result.callbackEvents.forEach(item => {
                    ipcRenderer.once(item.event, (e, ...data) => {
                        const callback = params[item.index];
                        if (typeof callback === 'function') {
                            callback.apply(cls.prototype, ...data);
                        }
                    });
                });

                ipcRenderer.send(NEST_RPC_INVOKE_EVENT, cls.name, method, {
                    event,
                    callbacks: result.callbackEvents
                }, ...result.parameters);

                return new Promise(resolve => {
                    ipcRenderer.once(event, (e, ...params) => resolve(...params));
                });
            }
        })
    }

    return cls.prototype;
};

function handleParams(cls, method, params: any[]) {
    const callbackEvents = [];
    const parameters = params.map((param, index) => {
        if (typeof param === 'function') {
            const event = `${ NEST_RPC_CALLBACK_EVENT }__${ cls.name }__${ method }__${ index }__${ uuid() }`;
            callbackEvents.push({ event, index });

            return { type: 'function', value: event }
        } else if (typeof param === 'object' || typeof param === 'boolean') {
            return { type: typeof param, value: JSON.stringify(param) }
        } else {
            return { type: typeof param, value: param }
        }
    });

    return { callbackEvents, parameters };
}
