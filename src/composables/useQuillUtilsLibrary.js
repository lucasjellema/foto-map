
export function useQuillUtilsLibrary() {

    const ensureDeltaFormat = (inputString) => {
        // if inputstring is actuall an object with a property called ops
        if (typeof inputString === 'object' && inputString !== null && inputString.hasOwnProperty('ops')) {
            return inputString;
        }
        try {
            // Attempt to parse the input string as JSON
            const potentialDelta = JSON.parse(inputString);

            // Check if the parsed object is a valid Delta format
            // A valid Delta must be an object with an 'ops' array
            if (potentialDelta && Array.isArray(potentialDelta.ops)) {
                // Iterate over 'ops' to ensure each operation has at least an 'insert' property
                for (let op of potentialDelta.ops) {
                    if (!op.hasOwnProperty('insert')) {
                        throw new Error('Invalid Delta format');
                    }
                }
                // Return the original string if it's a valid Delta format
                return potentialDelta
            } else {
                throw new Error('Not a Delta object');
            }
        } catch (error) {
            // If it's not a valid Delta or JSON, return a Delta format with the original string as plain text
            const delta = {
                "ops": [
                    {
                        "insert": inputString + "\n"
                    }
                ]
            }
            return delta
        }
    }

    // Example usage:
    // const input1 = '{"ops":[{"insert":"Hello, world!\n"}]}';  // Valid Delta
    // const input2 = "Just some plain text";

    // console.log(ensureDeltaFormat(input1));  // Outputs the Delta JSON unchanged
    // console.log(ensureDeltaFormat(input2));  // Converts the plain text to a Delta JSON


    return { ensureDeltaFormat };
}
