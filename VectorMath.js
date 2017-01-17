module.exports = {
    add : function(vec1, vec2)
    {
        return {x:vec1.x + vec2.x, y:vec1.y + vec2.y};
    },

    sub : function(vec1, vec2)
    {
        return {x:vec1.x - vec2.x, y:vec1.y - vec2.y};
    },

    norm : function(vec)
    {
        var length = this.len(vec);
        if(length != 0)
            return {x:vec.x / length, y:vec.y / length};
        else
            return vec;
    },

    len : function(vec)
    {
        return Math.abs(vec.x) + Math.abs(vec.y);
    },

    mult : function(vec1, vec2)
    {
        return {x:vec1.x * vec2.x, y:vec1.y * vec2.y};
    },

    multScalar : function(vec1, num)
    {
        return {x:vec1.x * num, y:vec1.y * num};
    },

    ortho : function(vec)
    {
        return {x:-vec.y, y:vec.x};
    }
}