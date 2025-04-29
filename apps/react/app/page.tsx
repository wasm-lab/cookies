'use client';
import { setCookie, getCookie, deleteCookie, getAllCookies } from '@wasm-lab/core';

export default function Home() {
    const onGetCookie = () => {
        const number = getCookie<{ number: number }>('hello');

        console.log(getAllCookies());
        if (!number) {
            return;
        }

        console.log(number, number.number + 10);
    };

    const onSetCookie = () => {
        setCookie('hello', {
            hello: false,
            world: 'hello',
            number: 10,
        });
    };

    const onDeleteCookie = () => {
        deleteCookie('hello');
    };

    return (
        <div>
            <div>helllo</div>
            <button onClick={onSetCookie}>set cookie</button>
            <button onClick={onGetCookie}>get cookie</button>
            <button onClick={onDeleteCookie}>delete cookie</button>
        </div>
    );
}
