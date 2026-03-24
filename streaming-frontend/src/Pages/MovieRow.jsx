<section className="container movie-row">

<h3 className="mb-4">Trending Now</h3>

<div className="movie-scroll">

{moviesData.trending.map(movie => (

<div className="movie-card" key={movie.id}>

<img src={movie.poster} alt={movie.title}/>

</div>

))}

</div>

</section>

