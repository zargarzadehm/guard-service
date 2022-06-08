import axios from "axios";
import config from "config";
import {JsonBI} from "../helpers/parser";

export interface SubscribeChannel {
    (msg: any, channel: string, sender: string): void;
    (msg: any, channel: string, sender: string, url: string): void;
}

export const apiCallBack = function (msg: any, channel: string, sender: string, url: string): void {
    const data = axios.post(
        url,
        {
            "msg": msg,
            "channel": channel,
            "sender": sender
        },
        {
            timeout: config.get<number>('callbackTimeout'),
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            }
        }
    );
    data.then(
        res => console.log("api callback response ", JsonBI.stringify(res.data, null, 4))
    ).catch(error => {
        if (axios.isAxiosError(error)) {
            console.warn('error message: ', error.message);
        } else {
            console.error('unexpected error: ', error);
        }
    });
} as SubscribeChannel