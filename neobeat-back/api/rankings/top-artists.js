// retorna artistas com mais plays
app.get('/api/rankings/top-artists', async (req, res) => {
  const { data } = await supabase
    .from('songs')
    .select('artist, play_count')
  
  // agrupa por artista e soma plays
  const map = {}
  for (const s of data) {
    map[s.artist] = (map[s.artist] || 0) + (s.play_count || 0)
  }
  const result = Object.entries(map)
    .map(([artist, plays]) => ({ artist, plays }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10)

  res.json(result)
})