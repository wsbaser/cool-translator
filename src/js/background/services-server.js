'use strict';

import guid from 'guid';
import $ from "jquery"

const CONNECTION_NAME = "services_connection";

export default class ServicesServer{
    constructor(services){
        this.services = services;
    }

    listener(message, port){
        let methodResult = this.callServiceMethod(message.serviceId, message.method, message.params);
        let requestResult = {
            requestGuid: message.requestGuid
        };
        let promises = {};
        if(methodResult.then && methodResult.catch){
            // it is a single promise
            requestResult.promiseGuid = guid();
            promises[requestResult.promiseGuid] = methodResult;
        }
        else{
            // it is a dictionary of promises
            requestResult.promiseGuids = {};
            for(let type in methodResult){
                const promiseGuid = guid()
                requestResult.promiseGuids[type] = promiseGuid;
                promises[promiseGuid] = methodResult[type];
            }
        }
        port.postMessage({
            requestResult: requestResult
        });
        // . bind promise events after sending promises to client
        //   if not, promises coud be resolved before client got their guids
        for(let guid in promises){
            this._bindPromiseEvents(promises[guid], port, guid);
        }
    }

    _bindPromiseEvents(promise, port, guid){
        promise.then((data)=>{
            this.resolvePromise(port, guid, data);
        })
        .catch((data)=>{
            this.rejectPromise(port, guid, data);
        });
    }

    resolvePromise(port, guid, data){
        let result = {
            promiseResult: {
                promiseGuid: guid,
                resolveData: data==null?{}:data
            }
        }
        port.postMessage(result);
    }

    rejectPromise(port, guid, data){
        let result = {
            promiseResult:{
                promiseGuid: guid,
                rejectData: data==null?{}:data
            }
        }
        port.postMessage(result);
    }

    callServiceMethod(serviceId, method, params){
        let service = this.services[serviceId];
        return service[method].apply(service, params);
    }

    listen(){
        chrome.runtime.onConnect.addListener(function(port){
            if(port.name != CONNECTION_NAME)
                return;
            port.onMessage.addListener(this.listener.bind(this));
        }.bind(this));
    }

    static create(servicesArr){
        var services = {};
        servicesArr.forEach(function(service){
            services[service.config.id] = service;
        });
        return new ServicesServer(services);
    }
}