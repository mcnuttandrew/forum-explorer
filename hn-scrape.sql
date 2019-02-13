
-- <!-- CREATE TABLES -->
CREATE TABLE stories (id INTEGER NOT NULL, score INTEGER, descendants INTEGER);

CREATE TABLE comments (id INTEGER NOT NULL, parent INTEGER NOT NULL);

COPY stories(id,score,descendants)
FROM '/Users/amc/Desktop/hn-scrape/hn-stories.csv' DELIMITER ',' CSV HEADER;

COPY comments(id,parent)
FROM '/Users/amc/Desktop/hn-scrape/hn-comments.csv' DELIMITER ',' CSV HEADER;

-- <!-- RECURSIVELY SELF JOIN -->

WITH RECURSIVE chain(from_id, to_id) AS (
  SELECT NULL, 'vc2'
  UNION
  SELECT c.to_id, t."ID2"
  FROM chain c
  LEFT OUTER JOIN Table1 t ON (t."ID1" = to_id)
  WHERE c.to_id IS NOT NULL
)
SELECT from_id FROM chain WHERE to_id IS NULL;

WITH RECURSIVE cte AS (
   SELECT id, parent AS path
   FROM   comments
   WHERE  id = 1

   UNION ALL
   SELECT c.id, c.parent, cte.path || c.id
   FROM   comments c
   JOIN   cte ON c.parent = cte.id
   )
SELECT DISTINCT ON (path[1:2])
       id, parent, path
     , count(*) OVER (PARTITION BY path[1:2]) - 1 AS children
FROM   cte
ORDER  BY path[1:2], path <> path[1:2]
LIMIT  200;  -- arbitrary limit, unrelated to the question


WITH RECURSIVE search_graph(id, parent) AS (
        SELECT c.id, c.parent, 1
        FROM comments c
      UNION ALL
        SELECT c.parent, c.id, COUNT(c.id)
        FROM comments c
)
SELECT * FROM search_graph;


-- <!-- SELECT stories.id
-- FROM stories LEFT JOIN comments ON comments.parent = stories.id -->


WITH RECURSIVE CTE AS (
  SELECT T.id AS StartID, T.id, T.parent, 1 AS Lvl
  FROM comments AS T

  UNION
  SELECT CTE.StartID, T.id, T.parent, CTE.Lvl + 1 AS Lvl
  FROM
      comments AS T
      INNER JOIN CTE
          ON CTE.id = T.parent
),
CTE_Distinct AS( SELECT DISTINCT StartID, id FROM CTE)
SELECT CTE_Distinct.StartID, COUNT(*) AS DescendantCount
FROM CTE_Distinct
INNER JOIN comments AS T ON T.id = CTE_Distinct.StartID
GROUP BY
    CTE_Distinct.StartID
    ,T.id
ORDER BY CTE_Distinct.StartID;
