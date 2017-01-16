function vecAdd(vec1, vec2)
{
    return {x:vec1.x + vec2.x, y:vec1.y + vec2.y};
}

function vecSub(vec1, vec2)
{
    return {x:vec1.x - vec2.x, y:vec1.y - vec2.y};
}

function vecNorm(vec)
{
    var len = vecLen(vec);
    if(len != 0)
        return {x:vec.x / len, y:vec.y / len};
    else
        return vec;
}

function vecLen(vec)
{
    return Math.abs(vec.x) + Math.abs(vec.y);
}

function vecMult(vec1, vec2)
{
     return {x:vec1.x * vec2.x, y:vec1.y * vec2.y};
}

function vecMultScalar(vec1, num)
{
     return {x:vec1.x * num, y:vec1.y * num};
}

function vecOrtho(vec)
{
     return {x:-vec.y, y:vec.x};
}