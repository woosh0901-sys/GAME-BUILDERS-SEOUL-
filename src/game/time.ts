export const getDateLabel = (year: number, turn: number) => {
  const month = ((turn - 1) % 12) + 1
  return `${year}년 ${month}월`
}

export const advanceTime = (year: number, turn: number) => turn === 12 ? { year: year + 1, turn: 1 } : { year, turn: turn + 1 }
