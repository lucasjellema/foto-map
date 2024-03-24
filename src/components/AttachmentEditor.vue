<template>
    <v-container>
        <v-card>
            <v-card-title>Attachment Editor</v-card-title>

            <v-card-text>
                <v-text-field v-model="model.label" label="Label"></v-text-field>
                <v-text-field v-model="model.description" label="Description"></v-text-field>
                <image-editor :image-url="model.imageUrl" :image-id="model.imageId" ref="imageEditorRef"
                    image-height=400 image-width=800 @image-change="handleImageChange"></image-editor>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
                <v-btn color="blue darken-1" text @click="saveAttachment">Save</v-btn>
            </v-card-actions>
        </v-card>

    </v-container>
</template>
<script setup>
const imageEditorRef = ref(null)
const model = defineModel(); // contains the attachment object - with a label, description, a timestamp, and an image url or imageId , another url for an external resource
const emit = defineEmits(['saveAttachment', 'closeDialog']);

onMounted(() => {
    console.log("AttachmentEditor onMounted" + model.value)
});

const handleImageChange = (event) => {
    model.value.imageId = event.imageId
    model.value.imageUrl = event.imageUrl
}
const saveAttachment = () => {
    emit('saveAttachment', {})
}

const closeDialog = () => {
    emit('closeDialog', {})
}

</script>
<style></style>