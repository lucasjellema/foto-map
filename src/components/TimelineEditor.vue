<template>
    <v-container>
        <v-card>
            <v-card-title>Timeline Editor</v-card-title>

            <v-card-text>
                <v-text-field v-model="model.label" label="Label"></v-text-field>
                <v-container>
                    <v-row class="">
                        <v-col cols="6">
                            From Start Time
                        </v-col>
                        <v-col cols="6">
                            To End Time
                        </v-col>
                    </v-row>
                    <v-row class="mt-0">
                        <v-col cols="3">
                            <v-text-field label="Start Date" type="date" v-model="startDatePart" </v-text-field>
                        </v-col>
                        <v-col cols="3">
                            <v-text-field label="Start Time" type="time" v-model="startTimePart"></v-text-field>
                        </v-col>
                        <v-col cols="3">
                            <v-text-field label="End Date" type="date" v-model="endDatePart" </v-text-field>
                        </v-col>

                        <v-col cols="3">
                            <v-text-field label="End Time" type="time" v-model="endTimePart"></v-text-field>
                        </v-col>
                    </v-row>
                </v-container>
                <v-sheet class="flex-1-1-100  ma-0 pa-0 mb-5">
                    <QuillEditor theme="snow" toolbar="essential" v-model:content="model.description"
                        contentType="delta" />
                </v-sheet>

                <div class="mb-5">
                    <span>Preview:
                        <hr :style="{
                    'border-style': `${model.lineStyle} none none none`
                    , 'border-width': model.width + 'px'
                    , 'border-color': model.color
                    , 'background-color': 'none'
                }" />
                    </span>
                </div>

                <v-container>
                    <v-row>
                        <v-col cols="6">
                            <v-slider label="Width" v-model="model.width" min="1" max="10"></v-slider>
                            <v-radio-group v-model="model.lineStyle" label="Style" hint="solid, dotted, dashed">
                                <v-radio label="Solid" value="solid"></v-radio>
                                <v-radio label="Dashed" value="dashed"></v-radio>
                                <v-radio label="Dotted" value="dotted"></v-radio>
                            </v-radio-group>
                        </v-col>
                        <v-col cols="6">
                            <v-color-picker v-model="model.color" hide-inputs label="Line Color"
                                class="mb-5"></v-color-picker>
                        </v-col>
                    </v-row>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
                <v-btn color="blue darken-1" text @click="saveTimeline">Save</v-btn>
            </v-card-actions>
        </v-card>

    </v-container>
</template>
<script setup>
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';

const model = defineModel(); // contains the timeline object 
const emit = defineEmits(['saveTimeline', 'closeDialog']);

const startDatePart = ref()
const startTimePart = ref()
const endDatePart = ref()
const endTimePart = ref()

onMounted(() => {
    const dateForStartTimestamp = new Date(model.value.startTimestamp)
  startDatePart.value = dateForStartTimestamp.toISOString().slice(0, 10)  
  startTimePart.value = dateForStartTimestamp.toISOString().substring(11, 16)

  const dateForEndTimestamp = new Date(model.value.endTimestamp)
  endDatePart.value = dateForEndTimestamp.toISOString().slice(0, 10)  
  endTimePart.value = dateForEndTimestamp.toISOString().substring(11, 16)
  

});

const saveTimeline = () => {

    model.value.startTimestamp = startDatePart.value + 'T' + startTimePart.value + ':00.000Z'
    model.value.endTimestamp = endDatePart.value + 'T' + endTimePart.value + ':00.000Z'



    emit('saveTimeline', {})
}


const closeDialog = () => {
    emit('closeDialog', {})
}

</script>
<style></style>