import json
import os
import sys

def convert_json(input_json):
    output_json = {"abbrivs": {}, "emoticons": {}}
    
    for category in input_json.values():
        for item in category.values():
            name = item.get("name", "")
            shortcuts = item.get("shortcuts", [])
            textmojis = item.get("textmojis", [])
            url = item.get("url", "")
            
            if shortcuts:
                shortcut = shortcuts[0]  # Taking the first shortcut as mapping
                for textmoji in textmojis:
                    output_json["abbrivs"][textmoji] = shortcut
                
                for shortcut in shortcuts:
                    output_json["emoticons"][shortcut] = url
    
    return output_json

# Load input JSON file
input_file = os.path.abspath(sys.argv[1])
output_file = os.path.abspath(sys.argv[2])

with open(input_file, "r", encoding="utf-8") as f:
    input_json = json.load(f)

output_json = convert_json(input_json)

# Write output JSON file
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(output_json, f, indent=4)
