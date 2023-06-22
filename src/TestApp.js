import React, { useState, useEffect } from 'react';
import './App.css';
import { Link } from 'react-router-dom';
import signalRServiceInstance from './signalr';

const TestApp = () => {
    const [instrumentID, setInstrumentID] = useState('');
    const [data, setData] = useState(null);

    useEffect(() => {
        signalRServiceInstance.registerDataUpdateCallback(onDataUpdate);
        return () => {
            signalRServiceInstance.deregisterDataUpdateCallback();
        };
    }, []);

    const onDataUpdate = data => {
        setData(data);
    };

    const handleInputChange = event => {
        setInstrumentID(event.target.value);
    };

    const addInstrument = () => {
        signalRServiceInstance.subscribeInstrument(instrumentID, 'clientID');
    };

    return (
        <div>
            <label htmlFor="instrumentID">ID</label>
            <input
                type="number"
                name="instrumentID"
                id="instrumentID"
                value={instrumentID}
                className="scanner-input-field"
                onChange={handleInputChange}
            />
            <button onClick={addInstrument}>Add Instrument</button>


            <Link to="/">
                <button className="route-to-landing-page" role="button">
                    Return Home
                </button>
            </Link>

            <table>
                <thead>
                    <tr>
        
                        <th>Instrument ID</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        
                        <td>{instrumentID}</td>
                        <td>{data}</td>
                    </tr>
                    <tr>
                      
                        <td>{instrumentID}</td>
                        <td>{data}</td>
                    </tr>
                </tbody>
            </table>

        </div>
    );
};

export default TestApp;
