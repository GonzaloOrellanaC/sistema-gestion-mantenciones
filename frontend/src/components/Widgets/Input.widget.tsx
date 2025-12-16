import { IonButton, IonContent, IonDatetime, IonIcon, IonInput, IonPopover } from "@ionic/react";
import "./Input.widget.scss";
import { eyeOffOutline, eyeOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useStylingContext } from "../../context/StylingContext";

interface InputInterface {
    type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | undefined;
    label?: string;
    placeholder?: string;
    value?: string | number | undefined;
    onInput?: (e: any) => void;
    name?: string;
    labelPlacement?: "fixed" | "start" | "end" | "floating" | "stacked" | undefined;
    key?: string | number | undefined;
    radius?: number
    disabled?: boolean
    passwordAleatory?: boolean
    readOnly?: boolean
}

export const Input = (props: InputInterface) => {
    const { colorPrimaryDefault } = useStylingContext();
    const [type, setType] = useState(props.type);
    useEffect(() => {
        if (props.type === 'date') {
            const element = document.getElementById('time-button')
            if (element) {
                element.style.display = 'none'
            }
        }
    }, [])

    /* función para crear una password aleatoria */
    const createRandomPassword = (length = 12) => {
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const digits = '0123456789';
        const all = lower + upper + digits;

        // Ensure at least one char from each set for stronger passwords
        const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
        let pwd = '';
        pwd += pick(lower);
        pwd += pick(upper);
        pwd += pick(digits);

        for (let i = pwd.length; i < length; i++) {
            pwd += all[Math.floor(Math.random() * all.length)];
        }

        // Shuffle
        pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');
        return pwd;
    }

    const handleGeneratePassword = () => {
        const pwd = createRandomPassword(12);
        // Create an event-like object compatible with IonInput onIonInput handler
        const eventLike: any = { detail: { value: pwd }, target: { value: pwd } };
        // Update parent
        try { props.onInput && props.onInput(eventLike); } catch (e) { /* ignore */ }
        // show the password briefly by switching to text type
        setType('text');
        // Optionally hide again after a short delay (5s)
        setTimeout(() => setType('password'), 5000);
    }
    
    return (
        <div key={props.key}>
            {props.label && <label style={{color:'rgba(0, 0, 0, 0.6)', fontSize: '0.7rem'}}>{props.label.toUpperCase()}</label>}
            {
                <div style={{padding: 5, border: '1px solid #ccc', borderRadius: 8}}>
                    {
                        props.type === 'date'
                        ?
                        <>
                            <br />
                            <button
                                id="click-trigger"
                                className="input-custom input-custom-button"
                            >{(props.value as string).split('T')[0]}</button>
                            <IonPopover trigger="click-trigger" triggerAction="click">
                                <IonContent>
                                    <IonDatetime presentation="date" onIonChange={props.onInput} />
                                </IonContent>
                            </IonPopover>
                        </>
                        :
                        <IonInput
                            type={type}
                            value={props.value}
                            onIonInput={props.onInput}
                            name={props.name}
                            placeholder={props.type === 'password' ? props.placeholder ? props.placeholder : '*****' : '' }
                            labelPlacement={props.labelPlacement}
                            className={`input-custom`}
                            style={{'--border-radius': props.radius ? props.radius : 0, position: 'relative'}}
                            disabled={props.disabled ? props.disabled : false}
                            readonly={props.readOnly ? props.readOnly : false}
                        >
                        {
                            props.type === 'password'
                            &&
                            <>
                            <IonButton 
                                slot="end"
                                shape={'round'}
                                fill={'clear'}
                                style={{
                                    '--ripple-color': colorPrimaryDefault,
                                    '--background-hover': colorPrimaryDefault + '20'
                                }}
                                onClick={() => {
                                    setType(type === 'password' ? 'text' : 'password')
                                }}>
                                <IonIcon slot="icon-only" icon={type === 'password' ? eyeOutline : eyeOffOutline}
                                    style={{
                                        color: colorPrimaryDefault
                                    }} />
                            </IonButton>
                            {props.passwordAleatory && <IonButton 
                                slot="end"
                                shape={'round'}
                                fill={'clear'}
                                style={{
                                    '--ripple-color': colorPrimaryDefault,
                                    '--background-hover': colorPrimaryDefault + '20',
                                    position: 'absolute', right: '-12rem',
                                    fontSize: '0.7rem'
                                }}
                                onClick={() => {
                                    handleGeneratePassword();
                                }}>
                                Password aleatory
                            </IonButton>}
                            </>
                            }
                        </IonInput>
                    }
                </div>
            }
        </div>
    );
}