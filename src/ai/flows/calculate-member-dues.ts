// src/ai/flows/calculate-member-dues.ts
'use server';

/**
 * @fileOverview Calculates the dues for a class member based on weeks since the start date and weekly rate.
 *
 * - calculateMemberDues - Calculates the member dues.
 * - CalculateMemberDuesInput - The input type for calculateMemberDues.
 * - CalculateMemberDuesOutput - The output type for calculateMemberDues.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateMemberDuesInputSchema = z.object({
  startDate: z
    .string()
    .describe('The start date of the dues calculation period in ISO format (YYYY-MM-DD).'),
  weeklyRate: z
    .number()
    .describe('The weekly dues rate for each member (e.g., 2000 for Rp 2,000).'),
  currentDate: z
    .string()
    .describe('The current date for calculating the number of weeks in ISO format (YYYY-MM-DD).'),
});
export type CalculateMemberDuesInput = z.infer<typeof CalculateMemberDuesInputSchema>;

const CalculateMemberDuesOutputSchema = z.object({
  totalDues: z
    .number()
    .describe('The calculated total dues for the member based on the weeks since the start date.'),
});
export type CalculateMemberDuesOutput = z.infer<typeof CalculateMemberDuesOutputSchema>;

export async function calculateMemberDues(input: CalculateMemberDuesInput): Promise<CalculateMemberDuesOutput> {
  return calculateMemberDuesFlow(input);
}

const calculateMemberDuesPrompt = ai.definePrompt({
  name: 'calculateMemberDuesPrompt',
  input: {schema: CalculateMemberDuesInputSchema},
  output: {schema: CalculateMemberDuesOutputSchema},
  prompt: `You are a financial assistant that calculates the total dues for a member.

Given the start date: {{{startDate}}}, the weekly rate: {{{weeklyRate}}}, and the current date: {{{currentDate}}},
calculate the total dues by determining the number of weeks between the start date and current date,
then multiplying it by the weekly rate.

Ensure the total dues is a number.

Respond ONLY with the total dues amount.
`,
});

const calculateMemberDuesFlow = ai.defineFlow(
  {
    name: 'calculateMemberDuesFlow',
    inputSchema: CalculateMemberDuesInputSchema,
    outputSchema: CalculateMemberDuesOutputSchema,
  },
  async input => {
    const {output} = await calculateMemberDuesPrompt(input);
    return output!;
  }
);
