export const promptManage = (lineText:string, contextText:string, contextTextNeeded?:boolean) : string => {
    let prompt = `
    You are an expert TypeScript developer.
    Based on the variable name and surrounding code context, infer the most accurate TypeScript type.

    Guidelines:
    - Use variable naming conventions to infer the type.
    - Use context if available to confirm or refine the guess.
    - Prefer primitive types (string, number, boolean) when likely.
    - For plural variable names (ending with 's', 'List', or 'Array'), infer Array<T>.
    - For names containing words like 'count', 'age', 'id', or 'length', infer number.
    - For names containing 'is', 'has', 'should', or 'can', infer boolean.
    - For names like 'phoneNo', 'email', or 'address', infer string.
    - If unclear, default to unknown.
    - Respond with ONLY the TypeScript type name (no explanation, no punctuation).

    Variable:
    ${lineText}`
    
    if(contextTextNeeded) {
        prompt += `Code context:${contextText}`;
    }
    
    console.log("Prompt ", prompt);
    return prompt;
}