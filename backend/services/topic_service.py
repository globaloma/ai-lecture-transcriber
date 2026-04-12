# import re
# import nltk
# from collections import Counter
# from nltk.tokenize import word_tokenize
# from nltk.util import ngrams

# # Download required NLTK data
# for package in [
#     "punkt",
#     "stopwords",
#     "averaged_perceptron_tagger",
#     "averaged_perceptron_tagger_eng"
# ]:
#     try:
#         nltk.data.find(package)
#     except LookupError:
#         nltk.download(package)

# from nltk.corpus import stopwords

# STOP_WORDS = set(stopwords.words("english"))

# EXTRA_STOP_WORDS = {
#     "going", "okay", "right", "know", "think", "just",
#     "like", "really", "actually", "basically", "kind",
#     "thing", "things", "want", "need", "make", "let",
#     "also", "well", "now", "get", "got", "would", "could",
#     "said", "say", "saying", "something", "anything",
#     "everything", "today", "lecture", "class", "students",
#     "professor", "teacher", "example", "examples", "look",
#     "see", "mean", "means", "talk", "talking", "discuss",
#     "discussing", "chapter", "section", "part", "point",
#     "points", "slide", "slides", "page", "concept",
#     "different", "important", "use", "using", "used",
#     "already", "teach", "learn"
# }

# ALL_STOP_WORDS = STOP_WORDS.union(EXTRA_STOP_WORDS)


# def clean_text(text: str) -> str:
#     text = text.lower()
#     text = re.sub(r"[^a-z0-9\s]", "", text)
#     text = re.sub(r"\s+", " ", text).strip()
#     return text


# def extract_candidate_phrases(text: str) -> list[str]:
#     """
#     Extract noun-like phrases from text.
#     """
#     cleaned = clean_text(text)

#     try:
#         tokens = word_tokenize(cleaned)
#     except Exception:
#         tokens = cleaned.split()

#     if not tokens:
#         return []

#     try:
#         tagged = nltk.pos_tag(tokens)
#     except Exception:
#         tagged = [(token, "NN") for token in tokens]

#     phrases = []
#     current_phrase = []

#     for word, tag in tagged:
#         if word in ALL_STOP_WORDS or len(word) < 3:
#             if current_phrase:
#                 phrases.append(" ".join(current_phrase))
#                 current_phrase = []
#             continue

#         # Keep nouns/adjectives together
#         if tag.startswith("NN") or tag.startswith("JJ"):
#             current_phrase.append(word)
#         else:
#             if current_phrase:
#                 phrases.append(" ".join(current_phrase))
#                 current_phrase = []

#     if current_phrase:
#         phrases.append(" ".join(current_phrase))

#     # Add bigrams/trigrams for extra phrase candidates
#     filtered_words = [
#         w for w in tokens
#         if w.isalpha() and len(w) > 3 and w not in ALL_STOP_WORDS
#     ]

#     bigrams = [" ".join(bg) for bg in ngrams(filtered_words, 2)]
#     trigrams = [" ".join(tg) for tg in ngrams(filtered_words, 3)]

#     phrases.extend(bigrams)
#     phrases.extend(trigrams)

#     # Clean and filter
#     phrases = [
#         p.strip()
#         for p in phrases
#         if p.strip() and len(p.split()) <= 4
#     ]

#     return phrases


# def choose_topic_title(phrases: list[str]) -> str:
#     if not phrases:
#         return "General Discussion"

#     freq = Counter(phrases)

#     # Prefer longer, more specific phrases
#     scored = sorted(
#         freq.items(),
#         key=lambda x: (len(x[0].split()), x[1]),
#         reverse=True
#     )

#     best_phrase = scored[0][0]

#     # If too generic, fall back to top 2 phrases
#     if len(best_phrase.split()) == 1 and len(scored) > 1:
#         second = scored[1][0]
#         return f"{best_phrase.title()} and {second.title()}"

#     return best_phrase.title()


# def chunk_segments_by_time(segments: list, target_seconds: int = 120) -> list:
#     """
#     Group segments into chunks of roughly target_seconds.
#     This gives better topic sections than fixed 10-segment chunks.
#     """
#     if not segments:
#         return []

#     chunks = []
#     current_chunk = []
#     current_start = None

#     for seg in segments:
#         start = seg.get("start_time", seg.get("start", 0))
#         end = seg.get("end_time", seg.get("end", 0))

#         if current_start is None:
#             current_start = start

#         current_chunk.append(seg)

#         duration = end - current_start
#         if duration >= target_seconds:
#             chunks.append(current_chunk)
#             current_chunk = []
#             current_start = None

#     if current_chunk:
#         chunks.append(current_chunk)

#     return chunks


# def detect_topics(segments: list, target_seconds: int = 120) -> list:
#     """
#     Detect topics from transcript segments.
#     Returns readable topic labels and timestamps.
#     """
#     if not segments:
#         return []

#     normalized = []
#     for seg in segments:
#         normalized.append({
#             "start_time": seg.get("start_time", seg.get("start", 0)),
#             "end_time": seg.get("end_time", seg.get("end", 0)),
#             "text": seg.get("segment_text", seg.get("text", ""))
#         })

#     chunks = chunk_segments_by_time(normalized, target_seconds=target_seconds)
#     topics = []

#     for i, chunk in enumerate(chunks):
#         combined_text = " ".join(
#             seg["text"] for seg in chunk if seg["text"]
#         ).strip()

#         if not combined_text:
#             continue

#         start_time = chunk[0]["start_time"]
#         end_time = chunk[-1]["end_time"]

#         phrases = extract_candidate_phrases(combined_text)
#         topic_title = choose_topic_title(phrases)

#         # keep a few good phrases for description
#         description = ", ".join(list(dict.fromkeys(phrases))[:5]) if phrases else "No keywords found"

#         topics.append({
#             "chunk_index": i,
#             "topic_title": topic_title,
#             "start_time": start_time,
#             "end_time": end_time,
#             "description": description,
#             "keywords": list(dict.fromkeys(phrases))[:5]
#         })

#     return topics





def detect_topics(segments: list, target_seconds: int = 120) -> list:
    """
    Simple topic detection:
    Groups segments by time and uses the first sentence
    of each group as the topic title.
    Always works. No NLP needed.
    """
    if not segments:
        return []

    # Normalize segment keys
    normalized = []
    for seg in segments:
        normalized.append({
            "start_time": seg.get("start_time", seg.get("start", 0)),
            "end_time": seg.get("end_time", seg.get("end", 0)),
            "text": seg.get("segment_text", seg.get("text", "")).strip()
        })

    if not normalized:
        return []

    # Group segments into chunks by time
    chunks = []
    current_chunk = []
    current_start = normalized[0]["start_time"]

    for seg in normalized:
        current_chunk.append(seg)
        duration = seg["end_time"] - current_start

        if duration >= target_seconds and len(current_chunk) >= 3:
            chunks.append(current_chunk)
            current_chunk = []
            current_start = seg["end_time"]

    # Don't forget the last chunk
    if current_chunk:
        chunks.append(current_chunk)

    # Generate topics from chunks
    topics = []

    for i, chunk in enumerate(chunks):
        # Combine all text in this chunk
        combined = " ".join(
            seg["text"] for seg in chunk if seg["text"]
        ).strip()

        if not combined:
            continue

        start_time = chunk[0]["start_time"]
        end_time = chunk[-1]["end_time"]

        # Get the first meaningful sentence as topic title
        topic_title = get_first_sentence(combined)

        # Get a short description from the chunk
        description = combined[:150].strip()
        if len(combined) > 150:
            description += "..."

        topics.append({
            "chunk_index": i,
            "topic_title": topic_title,
            "start_time": start_time,
            "end_time": end_time,
            "description": description,
            "keywords": []
        })

    return topics


def get_first_sentence(text: str) -> str:
    """
    Extract the first meaningful sentence from text.
    Clean it up and limit length.
    """
    # Remove extra whitespace
    text = " ".join(text.split())

    # Try to find first sentence ending
    for end_char in [".", "!", "?"]:
        pos = text.find(end_char)
        if pos != -1 and pos < 100:
            sentence = text[:pos].strip()
            if len(sentence) > 10:
                return capitalize_title(sentence)

    # If no sentence ending found, take first N words
    words = text.split()

    if len(words) <= 8:
        return capitalize_title(" ".join(words))

    return capitalize_title(" ".join(words[:8])) + "..."


def capitalize_title(text: str) -> str:
    """
    Capitalize first letter of each important word.
    """
    small_words = {
        "a", "an", "the", "and", "but", "or", "for",
        "in", "on", "at", "to", "of", "is", "it",
        "by", "up", "as", "so", "if", "we", "my"
    }

    words = text.strip().split()
    if not words:
        return text

    result = [words[0].capitalize()]

    for word in words[1:]:
        if word.lower() in small_words:
            result.append(word.lower())
        else:
            result.append(word.capitalize())

    return " ".join(result)