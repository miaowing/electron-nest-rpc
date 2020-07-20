import { ipcRenderer } from 'electron';
import { Type } from '@nestjs/common';
import { v1 } from 'uuid';
import { NEST_RPC_CALLBACK_EVENT, NEST_RPC_INVOKE_EVENT, NEST_RPC_INVOKE_RESPONSE_EVENT } from './constants';
import { RPCException } from './nest-rpc.exception';


export const nestRPC = <T = any>(cls: Type<T>, classname?: string): T => {
  let replaced = false;
  for (const method in cls.prototype) {
    if (!cls.prototype.hasOwnProperty(method)) {
      continue;
    }
    defineProperty(cls, method, classname);
    replaced = true;
  }

  if (!replaced) {
    const properties = Object.getOwnPropertyNames(cls.prototype);
    for (const key in properties) {
      if (!properties.hasOwnProperty(key)) {
        continue;
      }
      const method = properties[key];
      defineProperty(cls, method, classname);
    }
  }

  return cls.prototype;
};

function defineProperty(cls, method, classname) {
  Object.defineProperty(cls.prototype, method, {
    value: async (...params) => {
      const clsName = classname ?? cls.name;
      const result = handleParams(clsName, method, params);
      const event = `${NEST_RPC_INVOKE_RESPONSE_EVENT}__${clsName}__${method}__${v1()}`;

      result.callbackEvents.forEach(item => {
        ipcRenderer.once(item.event, (e, ...data) => {
          const callback = params[item.index];
          if (typeof callback === 'function') {
            callback.apply(cls.prototype, data);
          }
        });
      });

      ipcRenderer.send(NEST_RPC_INVOKE_EVENT, clsName, method, {
        event,
        callbacks: result.callbackEvents,
      }, ...result.parameters);

      return new Promise((resolve, reject) => {
        ipcRenderer.once(event, (e, msg, ...params) => {
          msg ? reject(new RPCException(msg)) : resolve(...params);
        });
      });
    },
  });
}

function handleParams(classname, method, params: any[]) {
  const callbackEvents = [];
  const parameters = params.map((param, index) => {
    if (typeof param === 'function') {
      const event = `${NEST_RPC_CALLBACK_EVENT}__${classname}__${method}__${index}__${v1()}`;
      callbackEvents.push({ event, index });

      return { type: 'function', value: event };
    } else if (typeof param === 'object' || typeof param === 'boolean') {
      return { type: typeof param, value: JSON.stringify(param) };
    } else {
      return { type: typeof param, value: param };
    }
  });

  return { callbackEvents, parameters };
}
