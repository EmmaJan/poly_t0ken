if (existingCollections.length > 0) {
  figma.ui.postMessage({ type: "has-variables", value: true });
} else {
  // Même sans variables locales, on peut scanner pour détecter les variables publiées
  figma.ui.postMessage({ type: "has-variables", value: false });
}


  try {
    var existingTokens = extractExistingTokens();

    var hasTokens = false;
    for (let cat in existingTokens.tokens) {
      if (existingTokens.tokens.hasOwnProperty(cat) && Object.keys(existingTokens.tokens[cat]).length > 0) {
        hasTokens = true;
        break;
      }
    }

    if (existingTokens && hasTokens) {
      figma.ui.postMessage({
        type: "existing-tokens",
        tokens: existingTokens.tokens,
        library: existingTokens.library
      });
    } else {
      figma.ui.postMessage({
        type: "existing-tokens",
        tokens: {},
        library: "tailwind"
      });
    }
  } catch (e) {
    // Ignorer les erreurs
  }
}





console.log('test');
