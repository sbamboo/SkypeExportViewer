import json
import os
import requests
from bs4 import BeautifulSoup

def extract_shortname(shortcuts):
    for shortcut in shortcuts:
        if shortcut.startswith("(") and shortcut.endswith(")"):
            return shortcut[1:-1]  # Remove parentheses
    return None

def download_image(url, output_folder, id_name):
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Extract file extension from URL
        file_ext = url.split(".")[-1].split("?")[0]
        filename = f"{id_name}_40x40.{file_ext}"
        filepath = os.path.join(output_folder, filename)
        
        with open(filepath, "wb") as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
        
        print(f"\033[32mDownloaded {filename}\033[0m")
        return filename
    except Exception as e:
        print(f"\033[31mError downloading {url}:\033[0m {e}")
        return None

def parse_html_and_json(html_file, json_file, output_folder="output"):
    os.makedirs(output_folder, exist_ok=True)
    
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

    # Find all "img" under the table and make a dictionary of dict[alt] = src
    img_dict = {img.get("alt"): img["src"] for img in article_content.find_all("img") if img.get("alt")}
    
    for category, entries in data.items():
        print(f"\033[34mProcessing category:\033[0m {category}")
        
        result[category] = {}
            
        for name, shortcuts in entries.items():
            print(f"\033[34mSearching for image with alt text:\033[0m {name}")

            non_emoticon_name = name.replace(" emoticon", "")
            id_name = non_emoticon_name.replace(" ", "_").lower()

            img_url = img_dict.get(name) or img_dict.get(non_emoticon_name)
            if not img_url:
                print(f"\033[31mError: No image found for '{name}'. Skipping.\033[0m")
                continue

            print(f"\033[32mFound URL for '{name}':\033[0m {img_url}")
            downloaded_filename = download_image(img_url, output_folder, id_name)
            #downloaded_filename = f"{id_name}_40x40.{img_url.split(".")[-1].split("?")[0]}"
            if not downloaded_filename:
                continue
            
            shortname = extract_shortname(shortcuts)
            if not shortname:
                print(f"\033[33mWarning: No valid shortname found for '{name}'.\033[0m")
                continue
            
            print(f"\033[32mExtracted shortname for '{name}':\033[0m {shortname}")
            
            # shortcuts_textmoji is every shortcut that has no parentheses in it rest in shortcuts_p
            shortcuts_textmoji = []
            shortcuts_p = []
            for shortcut in shortcuts:
                if shortcut.strip().startswith("(") and shortcut.strip().endswith(")"):
                    shortcuts_p.append(shortcut.lower())
                else:
                    shortcuts_textmoji.append(shortcut)

            result[category][id_name] = {
                "name": non_emoticon_name,
                "shortcuts": shortcuts_p,
                "textmojis": shortcuts_textmoji,
                #"url": "https://raw.githubusercontent.com/sbamboo/SkypeExportViewer/main/assets/emoticons/"+downloaded_filename
                "url": downloaded_filename
            }
    
    return result

# Example usage:
html_file = "scrape.html"
json_file = "data.json"
output_folder = "output"
output_data = parse_html_and_json(html_file, json_file, output_folder)

with open("output.json", "w", encoding="utf-8") as f:
    json.dump(output_data, f, indent=4, ensure_ascii=False)

print("\033[32mOutput saved to output.json.\033[0m")
