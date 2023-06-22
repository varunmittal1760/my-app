import { Component } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';

export const environment = {
    production: false,
    mdApiUrl: "https://marketdata-api.corp.hertshtengroup.com",
};

export class SignalRService extends Component {
    constructor(props) {
        super(props);
        const savedConfig = {};
        if (SignalRService.instance) {
            return SignalRService.instance; // Return the existing instance if available
        }

        this.state = {
            hubConnection: null,
            lastDataSubject: [],
            mounted: false,
            activeSubscription: [],
        };
        SignalRService.instance = this;
        return this;
    }

    componentDidMount() {
        this.setState({ mounted: true });
        this.connectToSignalRTAS();
    }

    saveUserConfig() {
        const userConfig = {
            activeSubscription: this.state.activeSubscription
        };
        localStorage.setItem('userSubs', JSON.stringify(userConfig));
    }

    componentWillUnmount() {
        this.setState({ mounted: false });
    }

    registerDataUpdateCallback(callback) {
        this.dataUpdateCallback = callback;
    }

    deregisterDataUpdateCallback() {
        this.dataUpdateCallback = null;
    }

    invokeDataUpdateCallback(data) {
        if (typeof this.dataUpdateCallback === 'function') {
            this.dataUpdateCallback(data);
        }
    }

    connectToSignalRTAS = () => {
        const hubConnection = new HubConnectionBuilder()
            .withUrl(environment.mdApiUrl + '/TASSignalRHub')
            .build();

        this.registerEventListeners(hubConnection);

        hubConnection.start()
            .then(() => {
                console.log('SignalR connection established.');
                if (this.state.activeSubscription.length !== [] && this.state.hubConnection.state === 'Connected') {
                    console.log('yes')
                    console.log(this.state.activeSubscription);
                    this.state.activeSubscription.forEach(instrumentID => {
                        console.log(instrumentID);
                        this.state.hubConnection.send('SubscribeTAS', instrumentID, 'clientId');
                        console.log('Subscribing instrument ' + instrumentID);
                    });
                }

                // Subscribe to the 'OnUpdate' event from the SignalR service
                hubConnection.on('OnUpdate', (data) => {
                    const object = JSON.parse(data);

                    if (object !== undefined) {
                        this.setState({ lastDataSubject: object });
                        this.invokeDataUpdateCallback(data);// Call the callback function with updated data
                    }
                });
            })
            .catch((error) => {
                console.error('Error establishing SignalR connection: ', error);
            });
        this.state.hubConnection = hubConnection;
    }

    addInstrumentToSet = (element) => {

        if (this.state.activeSubscription.indexOf(element) === -1) {
            this.state.activeSubscription.push(element);
            console.log(this.state.activeSubscription);
            this.saveUserConfig();
            return true;
        }
        else return false;

    };

    async subscribeInstrument(instrumentId, clientId) {
        const ifSubscribe = this.addInstrumentToSet(instrumentId);

        if (ifSubscribe) {
            if (this.state.hubConnection.state === 'Connected') {
                await this.state.hubConnection.send('SubscribeTAS', instrumentId, clientId);
                console.log('Subscribing instrument ' + instrumentId);
                // this.addInstrumentToSet(instrumentId);
                return true;
            } else {
                console.error('SignalR connection is not in the "Connected" state.');
                return false;
            }
        } else {
            console.log('Already subscribed ' + instrumentId);
            return true;
        }
    }

    unsubscribeInstrument = (instrumentId, clientId) => {
        console.log('Unsubscribing instrument ' + instrumentId);

        if (this.state.hubConnection.state === 'Connected') {
            this.state.hubConnection.send('UnsubscribeTAS', instrumentId, clientId);
        } else {
            console.error('SignalR connection is not in the "Connected" state.');
        }
    }

    registerEventListeners = (hubConnection) => {
        hubConnection.on('starting', () => {
            console.log('SignalR connection starting.');
        });

        hubConnection.on('received', (data) => {
            console.log('SignalR data received:', data);
        });

        hubConnection.on('connectionSlow', () => {
            console.log('SignalR connection is slow or frequently dropping.');
        });

        hubConnection.on('reconnecting', () => {
            console.log('SignalR connection is reconnecting.');
        });

        hubConnection.on('reconnected', () => {
            console.log('SignalR connection has reconnected.');
        });

        hubConnection.on('stateChanged', (state) => {
            console.log('SignalR connection state changed.');
        });

        hubConnection.on('disconnected', () => {
            console.log('SignalR connection has disconnected.');
        });
    }

    render() {
        return null; // or can return a React component if needed
    }
}

const signalRServiceInstance = new SignalRService();
signalRServiceInstance.componentDidMount(); // Create a single instance

export default signalRServiceInstance;
