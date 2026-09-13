const SCORING_WEIGHTS = Object.freeze({
  price: 0.3333,
  rating: 0.3333,
  popularity: 0.3334
});

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function priceComponent(price, minimum, maximum) {
  if (minimum === maximum) return 1;
  return clamp(1 - ((price - minimum) / (maximum - minimum)));
}

function ratingComponent(rating) {
  return rating === null ? 0 : clamp(rating / 5);
}

function popularityComponent(popularity, maximumPopularity, allProvidedPopularityEqual) {
  if (popularity === null) return 0;
  if (allProvidedPopularityEqual) return 1;
  return maximumPopularity > 0 ? clamp(popularity / maximumPopularity) : 0;
}

function confidence(item) {
  const evidenceCount = [
    item.rating,
    item.boughtLastMonthLowerBound,
    item.material,
    item.size,
    item.pieceCount,
    item.colorOptions.length ? item.colorOptions : null,
    item.availability,
    item.deliverySummary
  ].filter((value) => value !== null && value !== "").length;
  return evidenceCount >= 6 ? "high" : evidenceCount >= 3 ? "medium" : "low";
}

function rankingReasons(item, priceScore, minimumPrice, maximumPrice) {
  const formattedPrice = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.price);
  const reasons = [];
  if (minimumPrice === maximumPrice) {
    reasons.push(`All qualifying options share the same ${formattedPrice} price.`);
  } else if (priceScore >= 0.67) {
    reasons.push(`${formattedPrice} is among the lower prices in this qualifying set.`);
  } else {
    reasons.push(`${formattedPrice} fits the selected budget.`);
  }

  if (item.rating === null) {
    reasons.push("Rating evidence was not provided.");
  } else {
    const reviews = item.reviewCount === null ? "review count not provided" : `${item.reviewCount.toLocaleString("en-US")} reviews`;
    reasons.push(`Rated ${item.rating.toFixed(1)} out of 5; ${reviews}.`);
  }

  reasons.push(item.boughtLastMonthText
    ? `Recent Amazon signal: ${item.boughtLastMonthText}.`
    : "Recent-purchase evidence was not provided.");
  return reasons;
}

function rankProducts(items, finalistLimit = 5) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const prices = items.map((item) => item.price);
  const minimumPrice = Math.min(...prices);
  const maximumPrice = Math.max(...prices);
  const providedPopularity = items
    .map((item) => item.boughtLastMonthLowerBound)
    .filter((value) => value !== null);
  const maximumPopularity = providedPopularity.length ? Math.max(...providedPopularity) : 0;
  const allProvidedPopularityEqual = providedPopularity.length === items.length
    && new Set(providedPopularity).size === 1;

  return items
    .map((item, sourceIndex) => {
      const priceScore = priceComponent(item.price, minimumPrice, maximumPrice);
      const ratingScore = ratingComponent(item.rating);
      const popularityScore = popularityComponent(item.boughtLastMonthLowerBound, maximumPopularity, allProvidedPopularityEqual);
      const rawScore = (priceScore * SCORING_WEIGHTS.price)
        + (ratingScore * SCORING_WEIGHTS.rating)
        + (popularityScore * SCORING_WEIGHTS.popularity);
      return {
        item: {
          ...item,
          score: Math.round(rawScore * 1000) / 10,
          reasons: rankingReasons(item, priceScore, minimumPrice, maximumPrice),
          dataConfidence: confidence(item)
        },
        rawScore,
        sourceIndex
      };
    })
    .sort((left, right) => {
      if (right.rawScore !== left.rawScore) return right.rawScore - left.rawScore;
      const ratingDifference = (right.item.rating ?? -1) - (left.item.rating ?? -1);
      if (ratingDifference !== 0) return ratingDifference;
      if (left.item.price !== right.item.price) return left.item.price - right.item.price;
      return left.sourceIndex - right.sourceIndex;
    })
    .slice(0, finalistLimit)
    .map(({ item }, index) => ({ ...item, rank: index + 1 }));
}

module.exports = { rankProducts, SCORING_WEIGHTS };
