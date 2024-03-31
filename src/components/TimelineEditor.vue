<template>
    <v-container>
        <v-card>
            <v-card-title>Timeline Editor</v-card-title>

            <v-card-text>
                <v-text-field v-model="model.label" label="Label"></v-text-field>
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

                <!-- <v-text-field v-model="model.width" label="Width" hint="thickness in pixels" suffix="px"></v-text-field> -->
                <v-slider label="Width" v-model="model.width" min="1" max="10"></v-slider>
                <v-radio-group v-model="model.lineStyle" label="Style" hint="solid, dotted, dashed" inline>
                    <v-radio label="Solid" value="solid"></v-radio>
                    <v-radio label="Dashed" value="dashed"></v-radio>
                    <v-radio label="Dotted" value="dotted"></v-radio>
                </v-radio-group>
                <v-color-picker v-model="model.color" hide-inputs
                        label="Line Color" class="mb-5"></v-color-picker>
                
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

const model = defineModel(); // contains the timeline object 
const emit = defineEmits(['saveTimeline', 'closeDialog']);

onMounted(() => {

});

const saveTimeline = () => {
    emit('saveTimeline', {})
}


const closeDialog = () => {
    emit('closeDialog', {})
}

</script>
<style></style>