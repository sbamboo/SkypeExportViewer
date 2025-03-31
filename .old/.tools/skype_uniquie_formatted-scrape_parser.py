"""
The file is structured into categories and entries.
    - Categories: Indicated by lines enclosed in square brackets: [Category Name]. Each category is followed by a newline.
    - Entries: Each entry consists of three consecutive lines:
        - AltName
        - Name
        - Shortcuts
    - Entry Separation: Entries within a category are separated by a single newline.
    - Entry Line Separation: The AltName, Name, and Shortcuts lines within an entry are separated by a double newline.
"""

import os
import sys
import json

# if sys.argv[1] that is output_file else use "output.json"
# if sys.argv[2] that is input_file else use "source.txt" (this is in the custom format described above)

output_file = sys.argv[1] if len(sys.argv) > 1 else "output.json"
input_file = sys.argv[2] if len(sys.argv) > 2 else "skype_formatted-scrape_2025-03-31.txt"

if not os.path.isabs(output_file):
    output_file = os.path.abspath(output_file)
if not os.path.isabs(input_file):
    input_file = os.path.abspath(input_file)

with open(input_file, "r", encoding="utf-8") as f:
    lines = f.read().split("\n")

last_category = None
categories = {}

# Sort all lines under their categories, so if line.strip() begins with [ and ends with ] it is category,
#   add whats between [] to categories as key and empty list as value
#   else add the line to the last category in categories
for line in lines:
    line = line.strip()
    if line.startswith("[") and line.endswith("]"):
        last_category = line[1:-1]
        categories[last_category] = []
    elif last_category is not None:
        categories[last_category].append(line)

# Now for all categories remove the first line if it is empty and remove the last line if it is empty
for category in categories.keys():
    if categories[category][0] == "":
        categories[category].pop(0)

# Split the categories lines into their entries, each entry is:
#   [
#   "<AltName>",
#   "",
#   "",
#   "<Name>",
#   "",
#   "",
#   "<Shortcuts>",
#   ""
#   ]
sorted_out = {}
for key in categories.keys():

    sorted_out[key] = {}

    groups = []
    # Split the lines under the category into groups of 8
    for i in range(0, len(categories[key]), 8):
        groups.append(categories[key][i:i + 8])

    # Store as sorted_out[key][groups[3]] = groups[6].split(" ")
    for group in groups:
        sorted_out[key][group[3]] = group[6].split(" ")

# Write to output file as json
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(sorted_out, f, indent=4, ensure_ascii=False)
    print(f"Converted {input_file} to {output_file}")