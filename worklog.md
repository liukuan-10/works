---
Task ID: 1
Agent: Main Agent
Task: Rewrite pie chart with polyline leader lines showing percentage + side legend showing category names, prevent text overlap

Work Log:
- Analyzed user's uploaded reference image using VLM skill - identified style: outside labels with leader lines showing percentage + side legend with category names
- Replaced `renderPiePercentLabel` (text inside slices) with `renderPieCustomLabel` (polyline leader lines outside with percentage text)
- Implemented anti-overlap algorithm using ref tracker per side (left/right) with 16px minimum gap
- Added small dot at slice edge connection point for visual polish
- Updated PieChart margins from {5,5,5,5} to {25,55,25,55} to accommodate outside labels
- Reduced outerRadius from 80 to 70 for more label space
- Updated donut chart innerRadius from 42 to 38 proportionally
- Applied same label function to both pie and donut chart modes
- Updated side legend: removed percentage (now shown in leader line labels), only shows category names with color dots
- Reduced legend width from 120px to 90px (no longer needs space for percentage)
- Added overflow-visible to chart container div and ChartContainer

Stage Summary:
- Pie chart now uses polyline leader lines from slice edges to outside percentage labels
- Side legend shows only category names (color dot + name)
- Anti-overlap algorithm prevents text collision by adjusting Y positions per side
- All changes compiled and linted successfully
