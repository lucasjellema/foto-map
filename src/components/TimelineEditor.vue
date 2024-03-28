<template>
    <v-container>
        <v-card>
            <v-card-title>Timeline Editor</v-card-title>

            <v-card-text>
                <v-text-field v-model="model.label" label="Label"></v-text-field>
                <v-text-field v-model="model.color" label="Color"></v-text-field>
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