const allRoles = {
    user: ["manageCart"],
    admin: ["getUsers", "manageUsers","getOrders","manageProducts"],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = { roles, roleRights };
