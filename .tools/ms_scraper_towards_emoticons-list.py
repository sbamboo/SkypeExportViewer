import json
from bs4 import BeautifulSoup

def extract_shortname(shortcuts):
    for shortcut in shortcuts:
        if shortcut.startswith("(") and shortcut.endswith(")"):
            return shortcut[1:-1]  # Remove parentheses
    return None

def parse_html_and_json(html_file, json_file):
    try:
        with open(html_file, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f, "html.parser")
    except Exception as e:
        print(f"\033[31mError reading HTML file:\033[0m {e}")
        return {}
    
    try:
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"\033[31mError reading JSON file:\033[0m {e}")
        return {}
    
    print("\033[32mSuccessfully loaded HTML and JSON files.\033[0m")
    
    article_content = soup.find("main", id="supArticleContent")
    if not article_content:
        print("\033[31mError: Article content not found.\033[0m")
        return {}
    
    result = {}

    # find all "img" under the table and make a dictionary of dict[alt] = src
    img_dict = {}
    for img in article_content.find_all("img"):
        alt_text = img.get("alt")
        if alt_text:
            img_dict[alt_text] = img["src"]

    for category, entries in data.items():
        print(f"\033[34mProcessing category:\033[0m {category}")
        result[category] = {}
            
        for name, shortcuts in entries.items():
            print(f"\033[34mSearching for image with alt text:\033[0m {name}")

            non_emoticon_name = name.replace(" emoticon", "")
            # id_name is non_emoticon_name with spaces replaced with underscores and all lowercase
            id_name = non_emoticon_name.replace(" ", "_").lower()

            img = None

            # Check if img_dict[name] or if img_dict[name+" emoticon"] exists
            if name in img_dict.keys():
                img = img_dict[name]
            else:
                # try to find the non-emoticon name
                print(f"\033[33mWarning: Image with alt '{non_emoticon_name}' not found. Trying '{non_emoticon_name}'.\033[0m")
                if non_emoticon_name in img_dict.keys():
                    img = img_dict[non_emoticon_name]
                
            if not img:
                print(f"\033[31mError: No image found for '{name}'. Skipping.\033[0m")
                continue

            print(f"\033[32mExtracted URL for '{name}':\033[0m {img}")
            
            shortname = extract_shortname(shortcuts)
            if not shortname:
                print(f"\033[33mWarning: No valid shortname found for '{name}'.\033[0m")
                continue
            
            print(f"\033[32mExtracted shortname for '{name}':\033[0m {shortname}")
            
            # shortcuts_textmoji is every shortcut that has no parentheses in it rest in shortcuts_p
            shortcuts_textmoji = []
            shortcuts_p = []
            for shortcut in shortcuts:
                if "(" in shortcut and ")" in shortcut:
                    shortcuts_p.append(shortcut)
                else:
                    shortcuts_textmoji.append(shortcut)

            result[category][id_name] = {
                "name": non_emoticon_name,
                "shortcuts": shortcuts_p,
                "textmojis": shortcuts_textmoji,
                "url": img
            }
    
    return result

# Example usage:
html_file = "example.html"
json_file = "data.json"
output = parse_html_and_json(html_file, json_file)

with open("output.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=4, ensure_ascii=False)

print("\033[32mOutput saved to output.json.\033[0m")
