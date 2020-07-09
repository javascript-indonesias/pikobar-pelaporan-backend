'use strict';
const filterCloseContact = (query, user) => {
    let params = {}
    if (query.address_district_code) {
        params.address_district_code = query.address_district_code;
    }
    if (query.address_subdistrict_code) {
        params.address_subdistrict_code = query.address_subdistrict_code;
    }
    if (query.address_village_code) {
        params.address_village_code = query.address_village_code;
    }
    if (query.gender) {
        params.gender = query.gender;
    }
    if (query.is_reported) {
        params.is_reported = query.is_reported;
    }
    return params;
};

const filterSearch = (query) => {
    let search_params = {};
    if(query.search){ 
        search_params = [
            { name: new RegExp(query.search, "i") }
        ];
    }
    return search_params;
}; 

module.exports = {
    filterCloseContact, filterSearch
}