package com.example.ChatBot.dto.status;

import com.example.ChatBot.model.StatusDocument;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Response DTO for statuses grouped by user.
 * Replaces the raw Map<String, Object> that was built manually in the
 * controller.
 */
@Data
public class UserStatusesResponse implements Serializable {

    private String userMobile;
    private String userName;
    private List<StatusResponse> statuses;

    /**
     * {@code @JsonProperty} is required here because Lombok generates
     * getter {@code isOwn()} for primitive boolean fields, and Jackson
     * strips the "is" prefix — serializing it as "own" instead of "isOwn".
     * The frontend expects "isOwn", so we force the JSON key explicitly.
     */
    @JsonProperty("isOwn")
    private boolean isOwn;

    public static UserStatusesResponse from(String mobile, List<StatusDocument> statusDocs, String requestingMobile) {
        UserStatusesResponse dto = new UserStatusesResponse();
        dto.setUserMobile(mobile);
        dto.setUserName(statusDocs.get(0).getUserName());
        dto.setStatuses(
                statusDocs.stream()
                        .map(StatusResponse::from)
                        .collect(Collectors.toList()));
        dto.setOwn(mobile.equals(requestingMobile));
        return dto;
    }
}
