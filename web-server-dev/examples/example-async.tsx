
import createBridge from "../../dist/bridge";
import {useState} from "react";

export default function ExampleAsync() {


    AsyncBridge.useRegister('getName', () => {
        return () => 'DeliangShu ';
    })

    return <div>
        <p>DeliangShu(Global)</p>
        <button onClick={() => {
            AsyncBridge.getAPIAsync('getName').then((api => {
                    console.log('name:',api.current!());
                })
            );

        }}
                data-testid={'GlobalNameBtn'}
        >show me your name</button>

        <Joe/>

        <MikeWrapper/>
    </div>
};



const AsyncBridge = createBridge<
    {
        getName: () => string;
    }
>();

function Joe () {

    const cv = AsyncBridge.useContextValue();

    AsyncBridge.useRegister('getName', () => {
        return () => 'Joe';
    }, [], {contextValue: cv});

    return <div>
        <p>Joe</p>
        <button onClick={() => {
            AsyncBridge.getAPIAsync('getName', {contextValue: cv}).then(api => {
                console.log('name:',api.current!());
            })
        }}
                data-testid={'JoeNameBtn'}
        >
            show me your name
        </button>
    </div>
}

function MikeWrapper() {

    const [token, setToken] = useState(1);

    return <AsyncBridge.Boundary>
        <p>Mike Wrapper</p>
        <Mike key={token} token={token} onRenew={() => setToken(token + 1)}></Mike>
    </AsyncBridge.Boundary>
}

function Mike(props: { onRenew: () => void, token: number }) {

    AsyncBridge.useRegister('getName', () => {
        return () => 'Mike';
    });

    const {getAPIAsync} = AsyncBridge.useTools();

    return <div>
        <button onClick={() => {
            getAPIAsync('getName').then(api => {
                console.log('name:', api.current!());
            });


        }}
                data-testid={'MikeNameBtn'}
        >
            show me your name
        </button>
        <div/>
        <button onClick={() => {
            const pros = [
                new Promise((resolve,reject) => setTimeout(reject.bind(null, 'TimeOut'), 3000)),
                getAPIAsync('getName', {initial: false}).then(api => {
                    return api.current!();
                })
            ]

            Promise.race(pros)
                .then((name) => {
                    console.log(`none-initial name:${(name as string) + props.token}`)
                })
                .catch((err) => {
                console.error(err);
            });
        }}
                data-testid={'MikeRenewedNameBtn'}
        >
            show me your renewed name(may occur time out)
        </button>
        <div />
        <button onClick={() => { props.onRenew() }}
                data-testid={'RenewMikeName'}
        >
            renew
        </button>
    </div>
}