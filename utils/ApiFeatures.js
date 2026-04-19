 class APIFeatures {
    constructor(query, querystr) {
        this.query = query
        this.querystr = querystr
    }

    filter() {
        const queryObj = { ...this.querystr }
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach(el => delete queryObj[el])

        //1B) ADVANCED FILTERING
        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
        this.query = this.query.find(JSON.parse(queryStr))
        return this
    }

    sort() {
        if(this.querystr.sort) {
            console.log(this.querystr.sort)
            const sortBy = this.querystr.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy)
        }
        return this
    }

    limitFields() {
        if(this.querystr.fields) {
            console.log(this.querystr.fields)
            const fields = this.querystr.fields.split(',').join(' ')
            this.query = this.query.select(fields)
        }
        return this
    }

    paginate() {
        const page = this.querystr.page * 1 || 1
        const limit = this.querystr.limit * 1 || 100
        const skip = (page - 1) * limit
        this.query = this.query.skip(skip).limit(limit)
        return this
    }
}

module.exports = APIFeatures