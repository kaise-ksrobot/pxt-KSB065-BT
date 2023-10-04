/**
 * KSB065 V0.6.1
 */


enum dataType {
    //% block="temperature"
    temperature,
    //% block="humidity"
    humidity,

}

enum tempType {
    //% block="Celsius (*C)"
    celsius,
    //% block="Fahrenheit (*F)"
    fahrenheit,
}

enum LedType {
    //% block="LED1"
    LED1,
    //% block="LED2"
    LED2,
    //% block="LED3"
    LED3,
    //% block="LED4"
    LED4,
    //% block="ALL"
    ALL,
}


//% weight=10 color=#00A6F0 icon="\uf085" block="KSB065"
namespace KSB065 {

    let neoStrip: neopixel.Strip;
    let initialized = false;


    function init(): void {

        initialized = true;
    }


    //% blockId=Disable_Led_Matrix
    //% block="Sensor initialization"
    //% weight=70
    export function Disable_Led_Matrix(): void {
        led.enable(false)
        pins.digitalWritePin(DigitalPin.P7, 0);
    }




    /**
    * P1
    */
    //% blockId=KSB065_Slider
    //% block="Slider"
    //% weight=59
    export function Slider(): number {

        return pins.analogReadPin(AnalogPin.P1);
    }

    /**
    * P4
    */
    //% blockId=KSB065_Light
    //% block="Light"
    //% weight=58
    export function Light(): number {
        /*if (!initialized) {
            init()
        }*/

        return pins.analogReadPin(AnalogPin.P4);
    }

    /**
    * P7
    */
    //% blockId=KSB065_Relay
    //% block="Relay trig %trig"
    //% weight=54
    export function Relay(trig: boolean): void {

        if (trig)
            pins.digitalWritePin(DigitalPin.P7, 1);
        else
            pins.digitalWritePin(DigitalPin.P7, 0);
    }

    /**
    * P14
    */
    //% blockId=KSB065_Ultrasonic
    //% block="Ultrasonic(cm)"
    //% weight=57
    export function Ultrasonic(): number {

        let maxCmDistance = 500
        // send pulse
        pins.setPull(DigitalPin.P14, PinPullMode.PullNone);
        pins.digitalWritePin(DigitalPin.P14, 0);
        control.waitMicros(2);
        pins.digitalWritePin(DigitalPin.P14, 1);
        control.waitMicros(10);
        pins.digitalWritePin(DigitalPin.P14, 0);

        const d = pins.pulseIn(DigitalPin.P14, PulseValue.High, maxCmDistance * 58);
        // read pulse

        return Math.idiv(d, 58);
    }

    /**
    * P6 P1
    */
    //% blockId=KSB065_Motor
    //% block="Motor speed %speed"
    //% speed.min=-255 speed.max=255
    //% weight=55
    export function Motor(speed: number): void {

        if (speed >= 0) {
            pins.digitalWritePin(DigitalPin.P6, 1)
            pins.analogWritePin(AnalogPin.P1, 1023 - (speed * 4))

        } else {
            pins.digitalWritePin(DigitalPin.P6, 0)
            pins.analogWritePin(AnalogPin.P1, -(speed * 4))
        }


    }



    /**
    * P10
    */
    //% blockId="KSB065_RGB" 
    //% block="RGB %led"
    //% weight=45
    export function RGB_LED(led: LedType): neopixel.Strip {

        if (!neoStrip) {
            neoStrip = neopixel.create(DigitalPin.P10, 4, NeoPixelMode.RGB)

        }
        switch (led) {
            case LedType.LED1:
                return neoStrip.range(0, 1);
                break;
            case LedType.LED2:
                return neoStrip.range(1, 1);
                break;
            case LedType.LED3:
                return neoStrip.range(2, 1);
                break;
            case LedType.LED4:
                return neoStrip.range(3, 1);
                break;
            case LedType.ALL:
                return neoStrip;
                break;

        }
        return neoStrip;

    }

    /**
    * P9
    */
    //% blockId="KSB065_DHT11" 
    //% block="DHT11 $data"
    //% weight=56
    export function DHT11(data: dataType): number {

        //initialize
        let _temperature: number = -999.0
        let _humidity: number = -999.0
        let _readSuccessful: boolean = false
        let startTime: number = 0
        let endTime: number = 0
        let checksum: number = 0
        let checksumTmp: number = 0
        let dataArray: boolean[] = []
        let resultArray: number[] = []
        //let DHTstr: string = (DHT == DHTtype.DHT11) ? "DHT11" : "DHT22"

        let dataPin = DigitalPin.P9;

        for (let index = 0; index < 40; index++) dataArray.push(false)
        for (let index = 0; index < 5; index++) resultArray.push(0)


        startTime = input.runningTimeMicros()

        //request data
        pins.digitalWritePin(dataPin, 0) //begin protocol, pull down pin
        basic.pause(18)

        //if (pullUp)
        if (true)
            pins.setPull(dataPin, PinPullMode.PullUp) //pull up data pin if needed
        pins.digitalReadPin(dataPin) //pull up pin
        control.waitMicros(40)

        if (pins.digitalReadPin(dataPin) == 1) {


        } else {



            while (pins.digitalReadPin(dataPin) == 0); //sensor response
            while (pins.digitalReadPin(dataPin) == 1); //sensor response

            //read data (5 bytes)
            for (let index = 0; index < 40; index++) {
                while (pins.digitalReadPin(dataPin) == 1);
                while (pins.digitalReadPin(dataPin) == 0);
                control.waitMicros(28)
                //if sensor still pull up data pin after 28 us it means 1, otherwise 0
                if (pins.digitalReadPin(dataPin) == 1) dataArray[index] = true
            }

            endTime = input.runningTimeMicros()

            //convert byte number array to integer
            for (let index = 0; index < 5; index++)
                for (let index2 = 0; index2 < 8; index2++)
                    if (dataArray[8 * index + index2]) resultArray[index] += 2 ** (7 - index2)

            //verify checksum
            checksumTmp = resultArray[0] + resultArray[1] + resultArray[2] + resultArray[3]
            checksum = resultArray[4]
            if (checksumTmp >= 512) checksumTmp -= 512
            if (checksumTmp >= 256) checksumTmp -= 256
            if (checksum == checksumTmp) _readSuccessful = true

            //read data if checksum ok
            if (_readSuccessful) {
                if (true) {
                    //DHT11
                    _humidity = resultArray[0] + resultArray[1] / 100
                    _temperature = resultArray[2] + resultArray[3] / 100


                } else {
                    //DHT22
                    let temp_sign: number = 1
                    if (resultArray[2] >= 128) {
                        resultArray[2] -= 128
                        temp_sign = -1
                    }
                    _humidity = (resultArray[0] * 256 + resultArray[1]) / 10
                    _temperature = (resultArray[2] * 256 + resultArray[3]) / 10 * temp_sign


                }

            }



        }

        //wait 2 sec after query if needed
        //if (true) basic.pause(2000)
        if (true)
            basic.pause(500)
        return data == dataType.humidity ? _humidity : _temperature

    }





}