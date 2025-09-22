'use server';
/**
 * @fileOverview An AI flow to suggest similar member names based on a search query.
 *
 * - suggestSimilarNames - A function that handles the name suggestion process.
 * - SuggestSimilarNamesInput - The input type for the suggestSimilarNames function.
 * - SuggestSimilarNamesOutput - The return type for the suggestSimilarNames function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSimilarNamesInputSchema = z.object({
  query: z.string().describe('The user\'s search query for a member name.'),
  memberNames: z.array(z.string()).describe('The list of all available member names to search from.'),
});
export type SuggestSimilarNamesInput = z.infer<typeof SuggestSimilarNamesInputSchema>;

const SuggestSimilarNamesOutputSchema = z.object({
    similarNames: z.array(z.string()).describe('A list of member names that are considered similar or relevant to the user\'s query. Return up to 5 names.'),
});
export type SuggestSimilarNamesOutput = z.infer<typeof SuggestSimilarNamesOutputSchema>;

export async function suggestSimilarNames(input: SuggestSimilarNamesInput): Promise<SuggestSimilarNamesOutput> {
  return suggestSimilarNamesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSimilarNamesPrompt',
  input: {schema: SuggestSimilarNamesInputSchema},
  output: {schema: SuggestSimilarNamesOutputSchema},
  prompt: `You are an intelligent search assistant for a class roster. Your task is to find the most relevant names from a list of members based on a user's search query. The query might contain typos, partial names, or nicknames.

User's search query: "{{query}}"

List of all member names:
{{#each memberNames}}
- {{{this}}}
{{/each}}

Based on the query, identify up to 5 names from the list that are the most likely matches. Consider spelling variations, phonetic similarity, and partial matches.

Return the list of matching names in the 'similarNames' field. If no names are a reasonable match, return an empty array.
`,
});

const suggestSimilarNamesFlow = ai.defineFlow(
  {
    name: 'suggestSimilarNamesFlow',
    inputSchema: SuggestSimilarNamesInputSchema,
    outputSchema: SuggestSimilarNamesOutputSchema,
  },
  async (input) => {
    // A simple client-side filter for exact/partial matches first for performance.
    const directMatches = input.memberNames.filter(name => 
      name.toLowerCase().includes(input.query.toLowerCase())
    );

    if (directMatches.length > 0 && directMatches.length <= 5) {
      return { similarNames: directMatches.slice(0, 5) };
    }
    
    // If too many direct matches or no matches, use AI for smarter filtering.
    const {output} = await prompt(input);
    return output!;
  }
);
