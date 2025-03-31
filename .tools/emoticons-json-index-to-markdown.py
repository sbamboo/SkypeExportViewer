import os
import sys
import json

def json_to_markdown(json_data, output_file):
    with open(json_data, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    with open(output_file, 'w', encoding='utf-8') as md:
        for category, items in data.items():
            md.write(f"## {category}\n\n")
            md.write("| ID | Name | URL | Shortcuts | Textmojis |\n")
            md.write("|----|------|-----|-----------|-----------|\n")
            
            for item_id, item in items.items():
                name = item.get("name", "")
                url = item.get("url", "")
                shortcuts = " ".join(
                    ['`'+x+'`' for x in item.get("shortcuts", [])]
                )
                textmojis = " ".join(
                    ['`'+x+'`' for x in item.get("textmojis", [])]
                )
                md.write(f'| {item_id} | "{name}" | ![{name}]({url}) | {shortcuts} | {textmojis} |\n')
            
            md.write("\n")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py input.json output.md")
    else:
        json_to_markdown(os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2]))
