# import json
# from bson import json_util

# def parse_json(data):
#     """Converts MongoDB BSON/datetime objects to a JSON-serializable format."""
#     return json.loads(json_util.dumps(data))

import json
from bson import json_util

def parse_json(data):
    """Converts MongoDB BSON to JSON serializable."""
    return json.loads(json_util.dumps(data))
