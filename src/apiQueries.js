function apiQueries() {

    this.getGroup = function(groupId) {
        var deferred = UPTIME.pub.gadgets.promises.defer();
        $.ajax("/api/v1/groups/" + groupId, {
            cache : false
        }).done(function(data, textStatus, jqXHR) {
            deferred.resolve(data);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
        });
        return deferred.promise;
    };

    this.getElements = function (elementId) {
        var deferred = UPTIME.pub.gadgets.promises.defer();
        $.ajax("/api/v1/elements/" + elementId, {
            cache : false
        }).done(function(data, textStatus, jqXHR) {
            deferred.resolve(data);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
        });
        return deferred.promise;

    };

    this.getElementStatus = function(elementId) {
        var deferred = UPTIME.pub.gadgets.promises.defer();
        $.ajax("/api/v1/elements/" + elementId + "/status", {
            cache : false
        }).done(function(data, textStatus, jqXHR) {
            deferred.resolve(data);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
        });
        return deferred.promise;
    };

    this.getAllElements = function() {
        var deferred = UPTIME.pub.gadgets.promises.defer();
        $.ajax("/api/v1/elements", {
            cache : false
        }).done(function(data, textStatus, jqXHR) {
            if (data.length == 0) {
                deferred.reject("No elements found.");
            } else {
                deferred.resolve(data);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
        });
        return deferred.promise;
    };

    this.createGroupFilter = function(groupIds) {
        var deferred = UPTIME.pub.gadgets.promises.defer();
        $.ajax("/api/v1/groups/filter", {
            cache : false,
            type : 'Post',
            contentType : 'application/json',
            data : JSON.stringify({
                ids : groupIds
            }),
            processData : false,
            dataType : 'json'
        }).done(function(data, textStatus, jqXHR) {
            deferred.resolve(data.id);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
        });
        return deferred.promise;
    };

    this.getGroupStatuses = function(filterId) {
        var deferred = UPTIME.pub.gadgets.promises.defer();
        $.ajax("/api/v1/groups/filter/" + filterId + "/status", {
            cache : false
        }).done(function(data, textStatus, jqXHR) {
            deferred.resolve(data);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
        });
        return deferred.promise;
    };

    this.collectGroups = function(groups, groupId, idsToGroups, parentIdsToGroupIds) {
        groups.push(idsToGroups[groupId]);
        if (!parentIdsToGroupIds[groupId]) {
            return;
        }
        $.each(parentIdsToGroupIds[groupId], function(i, childGroupId) {
            collectGroups(groups, childGroupId, idsToGroups, parentIdsToGroupIds);
        });
    };

    this.findGroups = function(groupId, data) {
        var groups = [];
        if (!groupId || !data || !$.isArray(data) || data.length <= 0) {
            return groups;
        }
        var idsToGroups = {};
        var parentIdsToGroupIds = {};
        $.each(data, function(i, group) {
            idsToGroups[group.id] = group;
            var parentGroupId = group.groupId == null ? -1 : group.groupId;
            if (!parentIdsToGroupIds[group.groupId]) {
                parentIdsToGroupIds[parentGroupId] = [];
            }
            parentIdsToGroupIds[parentGroupId].push(group.id);
        });
        collectGroups(groups, groupId, idsToGroups, parentIdsToGroupIds);
        return groups;
    };

    this.getGroupWithSubGroups = function(groupId) {
        var deferred = UPTIME.pub.gadgets.promises.defer();
        $.ajax("/api/v1/groups", {
            cache : false
        }).done(function(data, textStatus, jqXHR) {
            if (data.length == 0) {
                deferred.reject("No groups found.");
            } else {
                var groups = findGroups(groupId, data);
                if (groups.length == 0) {
                    deferred.reject("Group not found.");
                } else {
                    deferred.resolve(groups);
                }
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
        });
        return deferred.promise;
    };

    this.getAllGroups = function() {
        var deferred = UPTIME.pub.gadgets.promises.defer();
        $.ajax("/api/v1/groups", {
            cache : false
        }).done(function(data, textStatus, jqXHR) {
            if (data.length == 0) {
                deferred.reject("No groups found.");
            } else {
                deferred.resolve(data);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            deferred.reject(UPTIME.pub.errors.toDisplayableJQueryAjaxError(jqXHR, textStatus, errorThrown, this));
        });
        return deferred.promise;
    };

    this.getStatusCounts = function(entityGroupId, statusType, includeSubgroup) {
        var result = {
            groupId : entityGroupId,
            groupName : undefined,
            hasSubgroups : undefined,
            total : 0,
            statusCount : {
                'OK' : 0,
                'WARN' : 0,
                'CRIT' : 0,
                'UNKNOWN' : 0,
                'MAINT' : 0
            }
        };

        var groupsPromise = null;
        var groupStatuses = [];
        if (includeSubgroup) {
            groupsPromise = getGroupWithSubGroups(entityGroupId);
        } else {
            groupsPromise = getGroup(entityGroupId);
        }
        return groupsPromise.then(function(groups) {
            if (!$.isArray(groups)) {
                groups = [ groups ];
            }
            var groupIds = $.map(groups, function(group) {
                return group.id;
            });
            result.groupName = groups[0].name;
            result.hasSubgroups = groups.length > 1;
            return createGroupFilter(groupIds).then(getGroupStatuses);
        }).then(function(groupStatuses) {
            $.each(groupStatuses, function(i, groupStatus) {
                if (statusType == "hostStatusType") {
                    $.each(groupStatus.elementStatus, function(index, element) {
                        if (element.isMonitored) {
                            result.statusCount[element.status]++;
                            result.total++;
                        }
                    });
                } else {
                    $.each(groupStatus.monitorStatus, function(index, monitor) {
                        if (monitor.isMonitored && !monitor.isHidden) {
                            result.statusCount[monitor.status]++;
                            result.total++;
                        }
                    });
                }
            });
            return result;
        });
    };

}