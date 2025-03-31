import json

def convert_emoji_data(input_file, output_file):
    """
    Loads emoji data from a JSON file, filters for emojis up to version 12,
    and creates a new JSON file mapping emoji names to their
    corresponding Unicode characters.

    Args:
        input_file (str): The path to the input JSON file.
        output_file (str): The path to the output JSON file.
    """

    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    emoji_map = {}

    for group in data["groups"]:
        for subgroup in group["subgroups"]:
            for emoji_data in subgroup["emojis"]:
                code_points, name, version = emoji_data
                if version <= 12:
                    emoji_chars = convert_to_emoji(code_points)

                    # to adhere to skype emoji naming convention replace any spaces and dashes and underscores with ""
                    name = name.replace(" ", "").replace("-", "").replace("_", "")

                    # Also remove any with additions so anything with ":" in name is skipped
                    if ":" in name:
                        continue

                    emoji_map[name] = emoji_chars

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(emoji_map, f, indent=2, ensure_ascii=False)


def convert_to_emoji(code_points):
    """
    Converts a string of concatenated Unicode code points (e.g., "1f600_1f642")
    into a single emoji character or a sequence of emoji characters.

    Args:
        code_points (str): A string of Unicode code points joined by underscores.

    Returns:
        str: The corresponding emoji character(s).
    """
    
    return "".join(chr(int(cp, 16)) for cp in code_points.split("_"))

if __name__ == "__main__":
    import sys
    import os
    
    input_file = sys.argv[1] if len(sys.argv) > 1 else "./emoji_v12_spec.json"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "./output.json"

    convert_emoji_data(os.path.abspath(input_file), os.path.abspath(output_file))
    print(f"Converted emoji data from {input_file} to {output_file}")
