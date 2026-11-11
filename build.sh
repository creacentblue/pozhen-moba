#!/bin/sh
# Rebuild index.html from src/
cd "$(dirname "$0")/src" && cat p0_head.html p1_core.js p2_data.js p3_logic.js p4_ai.js p5_render.js p6_ui.js p7_tail.html > ../index.html
