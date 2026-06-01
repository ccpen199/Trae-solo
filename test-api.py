import sys, json
d = json.load(sys.stdin)
print('Keys:', list(d.keys()))
print('report_chains:', len(d.get('report_chains', [])))
print('clue_review_links:', len(d.get('clue_review_links', [])))
