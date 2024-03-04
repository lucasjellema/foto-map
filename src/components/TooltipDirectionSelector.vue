<template>    
    <v-container>
        <v-row v-for="(row, rowIndex) in 3" :key="rowIndex">
            <v-col v-for="(col, colIndex) in 3" :key="colIndex" cols="1" offset="0"
                class="d-flex justify-center align-center" :class="{ 'highlightCell': isSelected(rowIndex, colIndex) }"
                @click="selectCell(rowIndex, colIndex)">
                <v-icon v-if="shouldShowIcon(rowIndex, colIndex)" large>
                    {{ getIconName(rowIndex, colIndex) }}
                </v-icon>
            </v-col>
        </v-row>
    </v-container>
</template>
<script setup>
const model = defineModel(); // contains a single string that indicates the direction/location of the tooltip
const selectedCell = ref({})

onMounted(() => {
    //find key from rowcolDirectionMap based on model.value
    const key = Object.keys(rowcolDirectionMap).find(key => rowcolDirectionMap[key] === model.value)
    // row is first character in key, col is third; select cell based on that
    const [row, col] = key.split('_')
    selectCell(parseInt(row),parseInt(col))
});
const shouldShowIcon = (rowIndex, colIndex) => {
    return (
        (rowIndex === 0 && colIndex === 1) ||
        (rowIndex === 1) ||
        (rowIndex === 2 && (colIndex === 1 || colIndex === 2))
    );
}
const getIconName = (rowIndex, colIndex) => {
    // Determine the icon based on the cell position
    if (rowIndex === 0 && colIndex === 1) return 'mdi-arrow-up';
    if (rowIndex === 2 && colIndex === 1) return 'mdi-arrow-down';
    if (rowIndex === 1 && colIndex === 0) return 'mdi-arrow-left';
    if (rowIndex === 1 && colIndex === 2) return 'mdi-arrow-right';
    if (rowIndex === 1 && colIndex === 1) return 'mdi-radiobox-marked';
    if (rowIndex === 2 && colIndex === 2) return 'mdi-xml';
}

const rowcolDirectionMap = { '0_1': 'top', '1_0': 'left', '1_2': 'right', '1_1': 'center', '2_1': 'bottom', '2_2': 'auto' }
const
    selectCell = (rowIndex, colIndex) => {
        // Update the model based on the selected cell
        if (getIconName(rowIndex, colIndex)) {
            selectedCell.value = { rowIndex, colIndex };
            const rowcol = `${rowIndex}_${colIndex}`
            model.value = rowcolDirectionMap[rowcol]
        }
    }

const isSelected = (rowIndex, colIndex) => {
    // Check if the cell is selected
    return (
        selectedCell.value &&
        selectedCell.value.rowIndex === rowIndex &&
        selectedCell.value.colIndex === colIndex
    );
}


</script>
<style>
.highlightCell {
    background-color: yellow;
}
</style>