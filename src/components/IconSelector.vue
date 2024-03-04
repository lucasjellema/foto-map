<template>
    <v-container>
        <v-row>
            <v-col cols="2" v-for="(icon, index) in icons" :key="index" class="text-center" @click="selectIcon(icon)">
                <v-icon large :color="model === icon ? 'blue' : 'black'" :class="{ 'icon-selected': model === icon }">
                    {{ icon }}
                </v-icon>
            </v-col>
        </v-row>
    </v-container>
</template>
<script setup>
const model = defineModel(); // contains a single string with the name of the icon

onMounted(() => {

});

const icons = [
    'mdi-home',
    'mdi-airplane',
    'mdi-bike',
    'mdi-car',
    'mdi-train',
    'mdi-theater',
    'mdi-church',
    'mdi-city',
    'mdi-tree',
    'mdi-parking',
    'mdi-hospital-building',
    'mdi-school',
    'mdi-beach',
    'mdi-martini',
    'mdi-shopping',
    'mdi-gas-station',
    'mdi-hotel',
    'mdi-music-note',
    'mdi-silverware-variant'
]


const selectIcon = (icon) => {
    model.value = icon; // Set the clicked icon as the selected icon
    console.log(model.value)
}
</script>
<style>
.icon-selected {
    transform: scale(1.5);
    /* Makes the icon larger */
}
</style>