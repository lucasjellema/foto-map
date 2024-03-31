<template>
  <div class="clock">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 70 70">
      <g transform="scale(0.25)">
              <g transform="translate(110,110)">
        <!-- tick -->
        <g>
          <circle r="108" class="x-clock-circle" fill="none" stroke-width="4" stroke="gray" />
          <circle r="97" class="x-clock-1-minute" fill="none" stroke-width="11" stroke="black"
            stroke-dasharray="4 46.789082" transform="rotate(-1.5)" />
          <circle r="100" class="x-clock-5-minute" fill="none" stroke-width="5" stroke="black"
            stroke-dasharray="2 8.471976" transform="rotate(-.873)" />
        </g>

        <!-- hands -->
        <g id="hands" transform="rotate(180)">
          <circle class="x-clock-center" r="7" fill="#333" />
          <g id="hour-hand" tabindex="0">
            <line class="x-clock-hour-hand" stroke-width="5" y2="70" stroke-linecap="round" stroke="#333" />
          </g>
          <g id="minute-hand" tabindex="0">
            <line class="x-clock-minute-hand" stroke-width="5" y2="85" stroke-linecap="round" stroke="#666" />
          </g>

        </g>
        <!-- numbers -->
        <g id="numbers" class="x-clock-numbers">
          <text x="35" y="-65">1</text>
          <text x="65" y="-35">2</text>
          <text x="75" y="5">3</text>
          <text x="65" y="45">4</text>
          <text x="35" y="75">5</text>
          <text x="-5" y="85">6</text>
          <text x="-45" y="75">7</text>
          <text x="-75" y="45">8</text>
          <text x="-85" y="5">9</text>
          <text x="-75" y="-35">10</text>
          <text x="-50" y="-65">11</text>
          <text x="-10" y="-75">12</text>
        </g>

      </g>
</g>
    </svg>
  </div>
</template>
<script setup>

const props = defineProps(['timestamp']);
const hour = ref(props.hour)
const minute = ref(props.minute)
const timestamp = ref(props.timestamp)

const date = computed(() => new Date(props.timestamp))
onMounted(() => {
  if (timestamp.value) {
    const date = new Date(timestamp.value)
    setHour(date.getHours(), date.getMinutes())
    setMinute(date.getMinutes())

  }
});

watch (date, (newDate) => {
  if (newDate) {
    setHour(newDate.getHours(), newDate.getMinutes())
    setMinute(newDate.getMinutes())
  }
})

function setHour(hour, min) {

  const hourDeg = ((hour % 12) * 60) / 2;
  const minDeg = (min / 60) * (360 / 12); // 1 hour 30 deg
  const hourRotateDeg = hourDeg + minDeg;
  document.querySelector('#hour-hand').setAttribute('transform', `rotate(${hourRotateDeg})`);
}
function setMinute(min) {
  //  const time = new Date();
  const minRotateDegree = 360 / 60 * min; // 1 min 6 deg
  document.querySelector('#minute-hand').setAttribute('transform', `rotate(${minRotateDegree})`);
}


</script>

<style scoped>
.clock {
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.clock-face {
  width: 100%;
  height: 100%;
  transform: rotate(180deg);
}
</style>
