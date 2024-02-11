/** Asynchronous sleep function
 * 
 * @param ms Time to sleep in milliseconds
 * @returns Promise which will fullfill after the desired milliseconds time
 */
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}