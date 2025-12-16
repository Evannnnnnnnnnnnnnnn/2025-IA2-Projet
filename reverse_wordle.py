import random
from pathlib import Path
import json
import argparse

import numpy as np
from tqdm import tqdm

from src.file import get_simulation_results_folder
from src.pattern import (
    get_pattern,
    get_possible_words,
    pattern_to_int_list,
    patterns_to_string,
    pattern_to_string,
)
from src.prior import get_frequency_based_priors, get_true_wordle_prior, get_word_list
from src.solver import brute_force_optimal_guess, optimal_guess

GAME_NAMES = ["wordle", "dungleon"]

# Helper function to convert user input string to a pattern integer
def string_to_pattern(s):
    """
    Converts a 5-letter string representation of a pattern to its integer form.
    'b' for black/miss -> 0
    'y' for yellow/misplaced -> 1
    'g' for green/exact -> 2
    """
    s = s.lower()
    if len(s) != 5:
        raise ValueError("Pattern string must be 5 characters long.")

    val_map = {'b': 0, 'y': 1, 'g': 2}
    pattern_list = []
    for char in s:
        if char not in val_map:
            raise ValueError(f"Invalid character '{char}' in pattern string. Use 'b', 'y', 'g'.")
        pattern_list.append(val_map[char])

    pattern = 0
    for i, val in enumerate(pattern_list):
        pattern += (3**i) * val
    return pattern

def play_game(
    game_name="wordle",
    first_guess=None,
    priors=None,
    look_two_ahead=False,
    optimize_for_uniform_distribution=False,
    hard_mode=False,
    purely_maximize_information=False,
    brute_force_optimize=False,
    brute_force_depth=10,
    language="en",
):
    all_words = get_word_list(game_name, short=False, language=language)
    short_word_list = get_word_list(game_name, short=True, language=language)

    if first_guess is None:
        # A good starting word
        first_guess = "TAIRE" if language == "fr" else "soare"

    if priors is None:
        priors = get_frequency_based_priors(game_name, language=language)


    guesses = []
    patterns = []
    possibilities = list(filter(lambda w: priors[w] > 0, all_words))
    guess = first_guess

    for turn in range(1, 7):
        print(f"\n--- Turn {turn} ---")
        print(f"My guess: {guess}")

        if len(possibilities) <= 10:
            print(f"Possible answers ({len(possibilities)}): {possibilities}")


        while True:
            try:
                pattern_str = input("Enter pattern (e.g., 'bygyg' for black, yellow, green, yellow, green): ")
                pattern = string_to_pattern(pattern_str)
                break
            except ValueError as e:
                print(e)

        print(f"Pattern: {pattern_to_string(pattern)}")

        # Check for win
        if pattern == 3**5 - 1:
            print(f"\nCongratulations! We solved it in {turn} guesses.")
            return

        guesses.append(guess)
        patterns.append(pattern)
        possibilities = get_possible_words(guess, pattern, possibilities, game_name, language=language)

        if not possibilities:
            print("\nThere are no possible words left. Something went wrong!")
            return

        
        choices = all_words
        if hard_mode:
            for g, p in zip(guesses, patterns, strict=True):
                choices = get_possible_words(g, p, choices, game_name, language=language)
        
        if brute_force_optimize:
            guess = brute_force_optimal_guess(
                choices,
                possibilities,
                priors,
                game_name=game_name,
                n_top_picks=brute_force_depth,
                language=language,
            )
        else:
            guess = optimal_guess(
                choices,
                possibilities,
                priors,
                game_name,
                look_two_ahead=look_two_ahead,
                purely_maximize_information=purely_maximize_information,
                optimize_for_uniform_distribution=optimize_for_uniform_distribution,
                language=language,
            )

    print("\nGame over! We couldn't solve it in 6 tries.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Wordle Interactive Solver")
    parser.add_argument(
        "--language",
        type=str,
        default="en",
        choices=["en", "fr"],
        help="Language for the wordle game (en or fr)",
    )
    args = parser.parse_args()

    print("--- Wordle Interactive Solver ---")
    print("Enter the 5-letter pattern you get from Wordle.")
    print("Use 'b' for black, 'y' for yellow, and 'g' for green.")
    print("Example: if the word is 'WATER' and you guess 'LATER', the pattern is 'bgggg' (L is not in the word).")
    
    play_game(
        priors=get_true_wordle_prior("wordle", language=args.language),
        language=args.language
    )
