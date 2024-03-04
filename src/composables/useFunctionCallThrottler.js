import { ref } from 'vue';

class FunctionCallThrottler {
  constructor(delay, apiFunction) {
    this.delay = delay;
    this.queue = [];
    this.isWaiting = false;
    this.apiFunction = apiFunction; // The function to be called
  }

  enqueueCall(...args) {
    this.queue.push(args);
    this.processQueue();
  }

  processQueue() {
    if (!this.isWaiting && this.queue.length > 0) {
      const args = this.queue.shift();
      this.apiFunction(...args); // Call the provided API function with arguments
      this.isWaiting = true;
      
      setTimeout(() => {
        this.isWaiting = false;
        this.processQueue();
      }, this.delay);
    }
  }
}

export function useFunctionCallThrottler(delay, apiFunction) {
    const functionCallThrottler = ref(new FunctionCallThrottler(delay, apiFunction));
  
    return { functionCallThrottler, enqueueCall: functionCallThrottler.value.enqueueCall.bind(functionCallThrottler.value) };
  }
